from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.payment import Payout, PaymentTransaction
from ..models.order import Order
from ..models.user import User
from ..core.deps import get_current_user, require_role
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/farmer", tags=["farmer"])

class TransactionOut(BaseModel):
    id: int
    order_id: int
    amount: float
    status: str
    created_at: datetime
    type: str  # 'payout' or 'payment'

    class Config:
        from_attributes = True

@router.get("/transactions", response_model=List[TransactionOut])
def get_farmer_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    # Fetch payouts for farmer
    payouts = db.query(Payout).filter(Payout.user_id == current_user.id).all()
    transactions = []
    for p in payouts:
        transactions.append(TransactionOut(
            id=p.id,
            order_id=p.order_id,
            amount=p.amount,
            status=p.status,
            created_at=p.created_at,
            type="payout"
        ))

    # Also include payment transactions related to orders where farmer is involved
    payments = db.query(PaymentTransaction).join(Order).filter(
        Order.product.has(farmer_id=current_user.id)
    ).all()
    for pay in payments:
        transactions.append(TransactionOut(
            id=pay.id,
            order_id=pay.order_id,
            amount=pay.amount,
            status=pay.status,
            created_at=pay.created_at,
            type="payment"
        ))

    # Sort by date descending
    transactions.sort(key=lambda x: x.created_at, reverse=True)
    return transactions