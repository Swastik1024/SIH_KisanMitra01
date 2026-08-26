from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from ..database import get_db
from ..models.payment import PaymentTransaction
from ..models.order import Order
from ..models.user import User
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/trader", tags=["trader"])

class TraderTransactionOut(BaseModel):
    id: int
    order_id: int
    amount: float
    status: str
    created_at: datetime
    type: str

    class Config:
        from_attributes = True

@router.get("/transactions", response_model=List[TraderTransactionOut])
def get_trader_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("trader"))
):
    transactions = db.query(PaymentTransaction).join(Order).filter(
        Order.trader_id == current_user.id
    ).all()
    result = []
    for tx in transactions:
        result.append(
            TraderTransactionOut(
                id=tx.id,
                order_id=tx.order_id,
                amount=tx.amount,
                status=tx.status,
                created_at=tx.created_at,
                type="payment",
            )
        )
    result.sort(key=lambda x: x.created_at, reverse=True)
    return result