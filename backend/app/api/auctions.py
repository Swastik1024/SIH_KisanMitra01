from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from ..database import get_db
from ..models.auction import Auction, Bid
from ..models.user import User
from ..models.product import Product, ProductMedia   # <-- added
from ..schemas.auction import AuctionOut, BidCreate, BidOut
from ..schemas.product import ProductPublicOut      # <-- added
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/auctions", tags=["auctions"])

class TraderBidOut(BaseModel):
    id: int
    auction_id: int
    bidder_id: int
    bid_amount: float
    bid_time: datetime
    is_winning: bool
    auction: AuctionOut

    class Config:
        from_attributes = True

@router.get("/my-bids", response_model=List[TraderBidOut])
def get_my_bids(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("trader"))
):
    bids = db.query(Bid).filter(Bid.bidder_id == current_user.id).order_by(Bid.bid_time.desc()).all()
    return bids

@router.get("/live", response_model=List[AuctionOut])
def get_live_auctions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    auctions = (
        db.query(Auction)
        .options(
            joinedload(Auction.product).joinedload(Product.media),
            joinedload(Auction.product).joinedload(Product.category),
        )
        .filter(
            Auction.status == "live",
            Auction.start_time <= now,
            Auction.end_time > now
        )
        .all()
    )
    return auctions

@router.post("/{auction_id}/bid", response_model=BidOut)
def place_bid(
    auction_id: int,
    bid_data: BidCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("trader"))
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if auction.end_time and now > auction.end_time:
        auction.status = "ended"
        db.commit()
        raise HTTPException(status_code=400, detail="Auction has ended")
    
    if auction.status in ["scheduled", "active", "live"]:
        if auction.status != "live":
            auction.status = "live"
            if auction.start_time > now:
                auction.start_time = now
    else:
        raise HTTPException(status_code=400, detail="Auction is not active")
    
    if current_user.id == auction.farmer_id:
        raise HTTPException(status_code=400, detail="Farmers cannot bid on their own produce")

    previous_highest_bidder_id = auction.current_highest_bidder_id

    if auction.current_highest_bid is not None and bid_data.bid_amount <= auction.current_highest_bid:
        raise HTTPException(status_code=400, detail="Bid must be higher than current bid")
    if bid_data.bid_amount < auction.base_price:
        raise HTTPException(status_code=400, detail="Bid must be at least base price")
    
    if auction.current_highest_bid is not None and bid_data.bid_amount < auction.current_highest_bid + auction.min_bid_increment:
        raise HTTPException(status_code=400, detail=f"Bid must be at least {auction.min_bid_increment} more than current bid")
    
    if auction.auto_extension_enabled and auction.end_time - now <= timedelta(minutes=2):
        auction.end_time = now + timedelta(minutes=5)
    
    bid = Bid(
        auction_id=auction_id,
        bidder_id=current_user.id,
        bid_amount=bid_data.bid_amount,
        is_winning=False
    )
    db.add(bid)
    auction.current_highest_bid = bid_data.bid_amount
    auction.current_highest_bidder_id = current_user.id
    
    # Reset winning flag on older bids
    db.query(Bid).filter(Bid.auction_id == auction_id).update({"is_winning": False})
    bid.is_winning = True

    # Send Outbid Notification to Previous Highest Bidder if different
    if previous_highest_bidder_id and previous_highest_bidder_id != current_user.id:
        from ..models.notification import Notification
        prod_name = auction.product.name if auction.product else "Crop"
        db.add(Notification(
            user_id=previous_highest_bidder_id,
            type="outbid_alert",
            message=f"You have been outbid on '{prod_name}'. The new highest bid is ₹{bid_data.bid_amount}."
        ))

    db.commit()
    db.refresh(bid)
    return bid