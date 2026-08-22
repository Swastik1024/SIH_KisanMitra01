from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.order import Order
from ..models.payment import PaymentTransaction, EscrowAccount, GSTInvoice
from ..models.user import User
from ..schemas.payment import PaymentCreate, PaymentOut, GSTInvoiceOut
from ..core.deps import get_current_user, require_role
import razorpay
from ..config import settings
import json

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
    
    # Create Razorpay order
    amount_in_paise = int(order.total_price * 100)
    razorpay_order = client.order.create({
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": f"order_{order.id}",
        "payment_capture": 1  # auto capture
    })
    
    payment = PaymentTransaction(
        order_id=order.id,
        gateway_transaction_id=razorpay_order["id"],
        amount=order.total_price,
        currency="INR",
        status="created",
        payment_method=None
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    try:
        client.utility.verify_webhook_signature(
            payload.decode(),
            signature,
            settings.RAZORPAY_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    data = json.loads(payload)
    if data["event"] == "payment.captured":
        # Extract payment details
        payment_id = data["payload"]["payment"]["entity"]["id"]
        order_id = data["payload"]["payment"]["entity"]["order_id"]
        # Find our payment transaction
        payment = db.query(PaymentTransaction).filter(
            PaymentTransaction.gateway_transaction_id == order_id
        ).first()
        if payment:
            payment.status = "captured"
            payment.payment_method = data["payload"]["payment"]["entity"].get("method")
            # Move order payment status to 'held' (escrow)
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            order.payment_status = "held"
            # Create escrow entry
            escrow = EscrowAccount(
                order_id=order.id,
                amount_held=payment.amount,
                status="held"
            )
            db.add(escrow)
            # Generate GST invoice (simplified)
            invoice = GSTInvoice(
                order_id=order.id,
                invoice_number=f"INV-{order.id}",
                gstin_seller="SELLERGSTIN",  # replace with actual
                gstin_buyer="BUYERGSTIN",    # replace with actual
                cgst=0, sgst=0, igst=0,      # compute based on GST rules
                total_amount=payment.amount,
                invoice_pdf_url=None  # generate later
            )
            db.add(invoice)
            db.commit()
    return {"status": "success"}