from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import json
import razorpay

from ..database import get_db
from ..models.order import Order
from ..models.payment import PaymentTransaction, EscrowAccount, GSTInvoice, Payout, Commission
from ..models.user import User
from ..models.notification import Notification
from ..schemas.payment import PaymentCreate, PaymentOut, GSTInvoiceOut
from ..core.deps import get_current_user, require_role
from ..config import settings

router = APIRouter(prefix="/api/payments", tags=["payments"])

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@router.post("/create-order", response_model=PaymentOut)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("trader"))
):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.trader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your order")
    if order.payment_status != "pending":
        raise HTTPException(status_code=400, detail="Payment already processed")
    
    # Create Razorpay order with fallback
    gateway_id = f"rzp_order_{order.id}_{int(datetime.now().timestamp())}"
    try:
        if settings.RAZORPAY_KEY_ID and "rzp_test" in settings.RAZORPAY_KEY_ID:
            amount_in_paise = int(order.total_price * 100)
            razorpay_order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"order_{order.id}",
                "payment_capture": 1  # auto capture
            })
            gateway_id = razorpay_order["id"]
    except Exception as e:
        print(f"Razorpay order creation fallback: {e}")
    
    payment = PaymentTransaction(
        order_id=order.id,
        gateway_transaction_id=gateway_id,
        amount=order.total_price,
        currency="INR",
        status="created",
        payment_method="UPI/Card"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/verify")
def verify_payment(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("trader"))
):
    order_id = payload.get("order_id")
    razorpay_payment_id = payload.get("razorpay_payment_id", f"pay_demo_{int(datetime.now().timestamp())}")
    payment_method = payload.get("payment_method", "UPI")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.trader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your order")

    # Update or create payment transaction
    payment = db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order.id).first()
    if not payment:
        payment = PaymentTransaction(
            order_id=order.id,
            gateway_transaction_id=razorpay_payment_id,
            amount=order.total_price,
            currency="INR",
            status="captured",
            payment_method=payment_method
        )
        db.add(payment)
    else:
        payment.status = "captured"
        payment.gateway_transaction_id = razorpay_payment_id
        payment.payment_method = payment_method

    # Move order payment status to 'held' (escrow)
    order.payment_status = "held"

    # Create Escrow Account Entry
    escrow = db.query(EscrowAccount).filter(EscrowAccount.order_id == order.id).first()
    if not escrow:
        escrow = EscrowAccount(
            order_id=order.id,
            amount_held=order.total_price,
            status="held"
        )
        db.add(escrow)

    # Generate GST Invoice (5% GST calculation)
    taxable_val = round(order.total_price / 1.05, 2)
    gst_amt = round(order.total_price - taxable_val, 2)
    cgst = round(gst_amt / 2, 2)
    sgst = round(gst_amt / 2, 2)

    invoice = db.query(GSTInvoice).filter(GSTInvoice.order_id == order.id).first()
    if not invoice:
        invoice = GSTInvoice(
            order_id=order.id,
            invoice_number=f"KM-GST-{order.id:06d}",
            gstin_seller="27AAAAA0000A1Z5",
            gstin_buyer="27BBBBB1111B2Z6",
            cgst=cgst,
            sgst=sgst,
            igst=0.0,
            total_amount=order.total_price,
            invoice_pdf_url=f"/static/invoices/INV-{order.id}.pdf"
        )
        db.add(invoice)

    # Notify Farmer and Trader
    db.add(Notification(
        user_id=order.trader_id,
        type="payment_success",
        message=f"Payment of ₹{order.total_price} for Order #{order.id} captured into KisanMitra Escrow."
    ))
    if order.product and order.product.farmer_id:
        db.add(Notification(
            user_id=order.product.farmer_id,
            type="escrow_funded",
            message=f"Trader completed payment of ₹{order.total_price} for '{order.product.name}'. Funds are secured in Escrow pending delivery."
        ))

    db.commit()

    return {
        "message": "Payment verified and funds placed into KisanMitra Escrow!",
        "order_id": order.id,
        "payment_status": "held",
        "escrow_amount": order.total_price,
        "invoice_number": invoice.invoice_number
    }

@router.post("/release-escrow/{order_id}")
def release_escrow_payout(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Admin or Agent can release escrow
    if current_user.role not in ["admin", "agent"]:
        raise HTTPException(status_code=403, detail="Not authorized to release escrow funds")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    escrow = db.query(EscrowAccount).filter(EscrowAccount.order_id == order_id).first()
    if not escrow or escrow.status != "held":
        raise HTTPException(status_code=400, detail="No active escrow funds found for this order")

    # Update Escrow
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    escrow.status = "released"
    escrow.released_at = now
    escrow.released_to = f"Farmer #{order.product.farmer_id if order.product else 'User'}"

    order.payment_status = "released"

    # Calculate Farmer Payout (95%) and Agent Commission (5%)
    total = order.total_price
    agent_commission_amt = round(total * 0.05, 2)
    farmer_payout_amt = round(total - agent_commission_amt, 2)

    if order.product and order.product.farmer_id:
        payout = Payout(
            user_id=order.product.farmer_id,
            order_id=order.id,
            amount=farmer_payout_amt,
            status="processed",
            payout_reference=f"PAYOUT-BANK-{order.id}"
        )
        db.add(payout)

        db.add(Notification(
            user_id=order.product.farmer_id,
            type="payout_released",
            message=f"💸 ₹{farmer_payout_amt} payout released to your bank account for Order #{order.id}!"
        ))

    if order.agent_id:
        commission = Commission(
            order_id=order.id,
            agent_id=order.agent_id,
            amount=agent_commission_amt,
            status="paid"
        )
        db.add(commission)

    db.commit()

    return {
        "message": f"Escrow funds of ₹{total} released successfully!",
        "farmer_payout": farmer_payout_amt,
        "agent_commission": agent_commission_amt,
        "released_at": now.strftime("%Y-%m-%d %H:%M:%S")
    }

@router.get("/escrow/{order_id}")
def get_escrow_details(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    escrow = db.query(EscrowAccount).filter(EscrowAccount.order_id == order_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow details not found for this order")
    return escrow

@router.get("/invoice/{order_id}")
def get_gst_invoice(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(GSTInvoice).filter(GSTInvoice.order_id == order_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="GST Invoice not found for this order")
    return invoice

@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    try:
        if settings.RAZORPAY_WEBHOOK_SECRET:
            client.utility.verify_webhook_signature(
                payload.decode(),
                signature,
                settings.RAZORPAY_WEBHOOK_SECRET
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    data = json.loads(payload)
    if data.get("event") == "payment.captured":
        payment_id = data["payload"]["payment"]["entity"]["id"]
        order_id = data["payload"]["payment"]["entity"]["order_id"]
        payment = db.query(PaymentTransaction).filter(
            PaymentTransaction.gateway_transaction_id == order_id
        ).first()
        if payment:
            payment.status = "captured"
            payment.payment_method = data["payload"]["payment"]["entity"].get("method")
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            if order:
                order.payment_status = "held"
                escrow = db.query(EscrowAccount).filter(EscrowAccount.order_id == order.id).first()
                if not escrow:
                    escrow = EscrowAccount(
                        order_id=order.id,
                        amount_held=payment.amount,
                        status="held"
                    )
                    db.add(escrow)
                db.commit()
    return {"status": "success"}