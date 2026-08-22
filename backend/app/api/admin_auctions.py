from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from ..database import get_db
from ..models.auction import Auction, Bid
from ..models.product import Product
from ..models.user import User
from ..core.deps import require_role

router = APIRouter(prefix="/api/admin/auctions", tags=["admin-auctions"])

@router.get("")
def list_auctions(
    search: str = Query("", description="Search by product name or farmer name"),
    status: str = Query("", description="Filter by status: live, scheduled, ended, cancelled"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """
    Admin endpoint to list all auctions with search, status filter, and pagination.
    """
    query = db.query(Auction).join(Product, Auction.product_id == Product.id).join(User, Auction.farmer_id == User.id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                User.name.ilike(search_term),
            )
        )

    if status:
        query = query.filter(Auction.status == status)

    total = query.count()
    auctions = (
        query.order_by(Auction.start_time.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    # Summary counts
    live_count = db.query(func.count(Auction.id)).filter(Auction.status == "live").scalar() or 0
    scheduled_count = db.query(func.count(Auction.id)).filter(Auction.status == "scheduled").scalar() or 0
    ended_count = db.query(func.count(Auction.id)).filter(Auction.status == "ended").scalar() or 0
    cancelled_count = db.query(func.count(Auction.id)).filter(Auction.status == "cancelled").scalar() or 0

    def auction_to_dict(auction):
        highest_bidder_name = None
        if auction.current_highest_bidder_id:
            bidder = db.query(User).filter(User.id == auction.current_highest_bidder_id).first()
            highest_bidder_name = bidder.name if bidder else "—"

        bid_count = db.query(func.count(Bid.id)).filter(Bid.auction_id == auction.id).scalar() or 0

        return {
            "id": auction.id,
            "product_id": auction.product_id,
            "product_name": auction.product.name if auction.product else "—",
            "farmer_name": auction.farmer.name if auction.farmer else "—",
            "agent_name": auction.agent.name if auction.agent else "—",
            "base_price": auction.base_price,
            "current_highest_bid": auction.current_highest_bid,
            "current_highest_bidder": highest_bidder_name,
            "status": auction.status,
            "start_time": auction.start_time.isoformat() if auction.start_time else None,
            "end_time": auction.end_time.isoformat() if auction.end_time else None,
            "bid_count": bid_count,
        }

    return {
        "summary": {
            "live": live_count,
            "scheduled": scheduled_count,
            "ended": ended_count,
            "cancelled": cancelled_count,
        },
        "total": total,
        "page": page,
        "limit": limit,
        "auctions": [auction_to_dict(a) for a in auctions],
    }