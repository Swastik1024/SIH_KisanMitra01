from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.order import Order
from ..models.payment import Payout
from ..core.deps import get_current_user

router = APIRouter(prefix="/api/farmer", tags=["farmer"])

@router.get("/transactions")
def get_farmer_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can access wallet")

    # 1. Get all payouts (earnings) from orders where farmer is the seller
    payouts = db.query(Payout).filter(Payout.user_id == current_user.id).all()
    # 2. Get all payments made by farmer (if any – e.g., platform fees, purchases)
    #    For simplicity, we only show orders where farmer is trader? But farmer can also buy.
    #    We'll filter orders where trader_id == current_user.id and payment_status in ('processed','completed')
    orders_as_buyer = db.query(Order).filter(
        Order.trader_id == current_user.id,
        Order.payment_status.in_(['processed', 'completed', 'captured', 'success'])
    ).all()

    transactions = []

    # Add payouts (credits)
    for p in payouts:
        transactions.append({
            "id": f"payout_{p.id}",
            "type": "payout",
            "amount": p.amount,
            "status": p.status,
            "order_id": p.order_id,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    # Add payments made (debits) – from orders where farmer is buyer
    for o in orders_as_buyer:
        transactions.append({
            "id": f"order_{o.id}",
            "type": "payment",
            "amount": o.total_price,
            "status": o.payment_status,
            "order_id": o.id,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })

    # Sort by created_at descending
    transactions.sort(key=lambda x: x["created_at"], reverse=True)

    # Calculate balance: sum of all payouts - sum of all payments
    total_payouts = sum(p.amount for p in payouts)
    total_payments = sum(o.total_price for o in orders_as_buyer)
    balance = round(total_payouts - total_payments, 2)

    return {
        "balance": balance,
        "transactions": transactions,
    }