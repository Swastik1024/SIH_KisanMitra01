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

@router.get("/auctions/{auction_id}/bids")
def get_farmer_auction_bids(
    auction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    from ..models.auction import Auction, Bid
    auction = db.query(Auction).filter(
        Auction.id == auction_id,
        Auction.farmer_id == current_user.id
    ).first()
    
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found or not owned by farmer")

    bids = db.query(Bid).filter(Bid.auction_id == auction_id).order_by(Bid.bid_amount.desc()).all()
    
    res = []
    for b in bids:
        bidder = b.bidder
        res.append({
            "id": b.id,
            "auction_id": b.auction_id,
            "bidder_id": b.bidder_id,
            "bidder_name": bidder.name if bidder else f"Trader #{b.bidder_id}",
            "bidder_phone": bidder.phone if bidder else "",
            "bid_amount": b.bid_amount,
            "bid_time": b.bid_time.strftime("%b %d, %Y %I:%M %p") if b.bid_time else None,
            "is_winning": b.is_winning,
            "status": getattr(b, "status", "pending") or "pending"
        })
        
    return {
        "auction_id": auction.id,
        "product_name": auction.product.name if auction.product else "Crop",
        "base_price": auction.base_price,
        "reserve_price": auction.reserve_price,
        "status": auction.status,
        "bids": res
    }

@router.post("/bids/{bid_id}/accept")
def accept_trader_bid_offer(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    from ..models.auction import Auction, Bid
    from ..models.notification import Notification

    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    auction = db.query(Auction).filter(
        Auction.id == bid.auction_id,
        Auction.farmer_id == current_user.id
    ).first()

    if not auction:
        raise HTTPException(status_code=403, detail="Not authorized to accept bids for this crop auction")

    if auction.status == "sold" or auction.status == "accepted":
        raise HTTPException(status_code=400, detail="Offer already accepted for this auction")

    # Mark all bids for this auction
    db.query(Bid).filter(Bid.auction_id == auction.id).update({"is_winning": False, "status": "rejected"})
    
    bid.is_winning = True
    bid.status = "accepted"

    auction.current_highest_bid = bid.bid_amount
    auction.current_highest_bidder_id = bid.bidder_id
    auction.status = "accepted"

    if auction.product:
        auction.product.status = "sold"

    # Create Order
    existing_order = db.query(Order).filter(Order.auction_id == auction.id).first()
    if not existing_order:
        order = Order(
            product_id=auction.product_id,
            auction_id=auction.id,
            trader_id=bid.bidder_id,
            agent_id=auction.agent_id,
            quantity=auction.product.quantity if auction.product else 1.0,
            total_price=bid.bid_amount,
            status="pending",
            payment_status="pending"
        )
        db.add(order)
        db.flush()
        order_id = order.id
    else:
        order_id = existing_order.id

    # Notify Trader
    prod_name = auction.product.name if auction.product else "Crop"
    db.add(Notification(
        user_id=bid.bidder_id,
        type="offer_accepted",
        message=f"🎉 Offer Accepted! Farmer accepted your bid of ₹{bid.bid_amount} for '{prod_name}'. Order #{order_id} generated for delivery."
    ))

    db.commit()

    return {
        "message": f"Bid offer of ₹{bid.bid_amount} accepted successfully!",
        "order_id": order_id,
        "auction_status": "accepted"
    }

@router.post("/bids/{bid_id}/reject")
def reject_trader_bid_offer(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer"))
):
    from ..models.auction import Auction, Bid
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    auction = db.query(Auction).filter(
        Auction.id == bid.auction_id,
        Auction.farmer_id == current_user.id
    ).first()

    if not auction:
        raise HTTPException(status_code=403, detail="Not authorized")

    bid.status = "rejected"
    db.commit()

    return {"message": "Bid offer rejected"}