from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..database import get_db
from ..models.user import User
from ..models.order import Order
from ..models.product import Product
from ..models.payment import Payout
from ..core.deps import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/farmer", tags=["farmer"])

@router.get("/transactions")
def get_farmer_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can access wallet")

    # ---------- 1. Get all products owned by this farmer ----------
    farmer_product_ids = db.query(Product.id).filter(Product.farmer_id == current_user.id).all()
    product_ids = [p[0] for p in farmer_product_ids]
    logger.info(f"Farmer {current_user.id} has {len(product_ids)} products")

    if not product_ids:
        return {"balance": 0, "pending_balance": 0, "transactions": []}

    # ---------- 2. Orders for those products (not cancelled) ----------
    seller_orders = (
        db.query(Order)
        .filter(Order.product_id.in_(product_ids))
        .filter(Order.status != "cancelled")
        .all()
    )
    logger.info(f"Found {len(seller_orders)} seller orders")

    # ---------- 3. Payouts (already processed) ----------
    payouts = db.query(Payout).filter(Payout.user_id == current_user.id).all()
    payout_order_ids = {p.order_id for p in payouts}

    # ---------- 4. Buyer orders (farmer made purchases) ----------
    buyer_orders = (
        db.query(Order)
        .filter(Order.trader_id == current_user.id)
        .filter(Order.payment_status.in_(['processed', 'completed', 'captured', 'success']))
        .filter(Order.status != "cancelled")
        .all()
    )

    transactions = []
    pending_balance = 0.0
    processed_balance = 0.0

    # ---- Process seller orders ----
    for order in seller_orders:
        # Fetch product separately to be safe
        product = db.query(Product).filter(Product.id == order.product_id).first()
        if not product:
            logger.warning(f"Product {order.product_id} not found for order {order.id}")
            continue

        gross_amount = product.price * order.quantity
        if order.id in payout_order_ids:
            status = 'processed'
            processed_balance += gross_amount
        else:
            status = 'pending'
            pending_balance += gross_amount

        transactions.append({
            "id": f"seller_{order.id}",
            "type": "credit",
            "amount": gross_amount,
            "status": status,
            "order_id": order.id,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "description": f"Sale of {product.name} × {order.quantity} {product.unit}",
        })

    # ---- Process buyer orders ----
    for order in buyer_orders:
        transactions.append({
            "id": f"buyer_{order.id}",
            "type": "payment",
            "amount": order.total_price,
            "status": order.payment_status,
            "order_id": order.id,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "description": f"Purchase #{order.id}",
        })

    # Sort by date descending
    transactions.sort(key=lambda x: x["created_at"] or "", reverse=True)

    total_payments = sum(o.total_price for o in buyer_orders)
    balance = round(processed_balance - total_payments, 2)

    logger.info(f"Returning pending balance: {pending_balance}")

    return {
        "balance": balance,
        "pending_balance": round(pending_balance, 2),
        "transactions": transactions,
    }