from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from datetime import datetime
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User
from ..models.product import Product, InspectionReport
from ..models.order import Order
from ..models.payment import Payout, PaymentTransaction
from ..models.farmer import FarmerProfile
from ..schemas.farmer import FarmerProfileUpdate, FarmerProfileOut
from ..core.deps import get_current_user, require_role

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

@router.get("/stats")
def get_farmer_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    total_products_sold = db.query(func.count(Order.id)).join(Product).filter(
        Product.farmer_id == current_user.id,
        Order.status == "delivered"
    ).scalar() or 0

    total_earnings = db.query(func.coalesce(func.sum(Payout.amount), 0)).filter(
        Payout.user_id == current_user.id,
        Payout.status == "processed"
    ).scalar() or 0

    quality_grades = db.query(
        InspectionReport.quality_grade,
        func.count(InspectionReport.id)
    ).join(Product, Product.id == InspectionReport.product_id).filter(
        Product.farmer_id == current_user.id
    ).group_by(InspectionReport.quality_grade).all()

    grade_counts = {grade: count for grade, count in quality_grades}
    grades_summary = {
        "A": grade_counts.get("A", 0),
        "B": grade_counts.get("B", 0),
        "C": grade_counts.get("C", 0),
        "D": grade_counts.get("D", 0),
        "total_graded": sum(grade_counts.values())
    }

    return {
        "total_products_sold": total_products_sold,
        "total_earnings": float(total_earnings),
        "quality_grades": grades_summary
    }

@router.get("/profile", response_model=FarmerProfileOut)
def get_farmer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        profile = FarmerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=FarmerProfileOut)
def update_farmer_profile(
    data: FarmerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        profile = FarmerProfile(user_id=current_user.id)
        db.add(profile)

    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/transactions", response_model=List[TransactionOut])
def get_farmer_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    transactions = []

    # Payouts
    payouts = db.query(Payout).filter(Payout.user_id == current_user.id).all()
    for p in payouts:
        transactions.append(
            TransactionOut(
                id=p.id,
                order_id=p.order_id,
                amount=p.amount,
                status=p.status,
                created_at=p.created_at,
                type="payout",
            )
        )

    # Payments related to farmer's products
    payments = db.query(PaymentTransaction).join(Order).filter(
        Order.product.has(farmer_id=current_user.id)
    ).all()
    for pay in payments:
        transactions.append(
            TransactionOut(
                id=pay.id,
                order_id=pay.order_id,
                amount=pay.amount,
                status=pay.status,
                created_at=pay.created_at,
                type="payment",
            )
        )

    # Sort by date descending
    transactions.sort(key=lambda x: x.created_at, reverse=True)
    return transactions