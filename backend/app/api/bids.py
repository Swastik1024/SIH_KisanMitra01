from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.auction import Auction, Bid
from ..models.user import User
from ..core.deps import require_role

router = APIRouter(prefix="/api/auctions", tags=["auctions"])

class BidCreate(BaseModel):
    bid_amount: float

@router.post("/{product_id}/bid")
def place_bid(
    product_id: int,
    data: BidCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("trader")),
):
    # Find auction by product_id
    auction = db.query(Auction).filter(Auction.product_id == product_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found for this product")

    if auction.status != "live":
        raise HTTPException(status_code=400, detail="Auction is not live")

    if data.bid_amount <= auction.current_highest_bid:
        raise HTTPException(status_code=400, detail="Bid must be higher than current highest bid")

    if data.bid_amount < auction.base_price:
        raise HTTPException(status_code=400, detail="Bid below base price")

    # Update auction highest bid
    auction.current_highest_bid = data.bid_amount
    auction.current_highest_bidder_id = current_user.id

    # Record the bid
    bid = Bid(
        auction_id=auction.id,
        bidder_id=current_user.id,
        bid_amount=data.bid_amount,
    )
    db.add(bid)
    db.commit()

    return {
        "message": "Bid placed successfully",
        "current_highest_bid": auction.current_highest_bid,
    }