from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

from ..database import get_db
from ..models.user import User
from ..models.product import Product
from ..models.order import Order
from ..models.auction import Auction
from ..core.deps import require_role

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard")
def admin_dashboard(
    period: str = Query("7d"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """
    Admin dashboard summary endpoint.
    Returns stats, revenue, auctions, deliveries, recent orders/listings/users,
    pending inspections, and pending delivery requests.
    """

    # ---------- DATE RANGE ----------
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if period == "24h":
        start_date = now - timedelta(hours=24)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    elif period == "1y":
        start_date = now - timedelta(days=365)
    else:  # default 7d
        start_date = now - timedelta(days=7)

    # ---------- MAIN STATS ----------
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_farmers = db.query(func.count(User.id)).filter(User.role == "farmer").scalar() or 0
    total_traders = db.query(func.count(User.id)).filter(User.role == "trader").scalar() or 0

    active_listings = db.query(func.count(Product.id)).filter(Product.status == "active").scalar() or 0
    active_auctions = db.query(func.count(Auction.id)).filter(Auction.status == "live").scalar() or 0
    pending_inspections = db.query(func.count(Product.id)).filter(Product.status == "pending_inspection").scalar() or 0

    pending_orders = db.query(func.count(Order.id)).filter(Order.status == "pending").scalar() or 0
    processing_orders = db.query(func.count(Order.id)).filter(Order.status.in_(["accepted", "shipped"])).scalar() or 0
    completed_orders = db.query(func.count(Order.id)).filter(Order.status == "delivered").scalar() or 0
    cancelled_orders = db.query(func.count(Order.id)).filter(Order.status == "cancelled").scalar() or 0

    # ---------- DELIVERY BREAKDOWN ----------
    pending_deliveries = db.query(func.count(Order.id)).filter(Order.status == "pending").scalar() or 0
    assigned_deliveries = db.query(func.count(Order.id)).filter(Order.status == "accepted").scalar() or 0
    in_transit_deliveries = db.query(func.count(Order.id)).filter(Order.status == "shipped").scalar() or 0
    delivered_deliveries = db.query(func.count(Order.id)).filter(Order.status == "delivered").scalar() or 0

    # ---------- REVENUE ----------
    total_revenue = db.query(func.coalesce(func.sum(Order.total_price), 0.0)).filter(
        Order.status == "delivered"
    ).scalar() or 0.0

    # Revenue chart for last 7 days
    revenue_chart = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_value = db.query(func.coalesce(func.sum(Order.total_price), 0.0)).filter(
            Order.created_at >= day_start,
            Order.created_at < day_end,
            Order.status.in_(["delivered", "shipped"])
        ).scalar() or 0.0
        revenue_chart.append({
            "label": day.strftime("%a"),
            "value": float(day_value)
        })

    # ---------- AUCTIONS ----------
    live_auctions = db.query(func.count(Auction.id)).filter(Auction.status == "live").scalar() or 0
    upcoming_auctions = db.query(func.count(Auction.id)).filter(Auction.status == "scheduled").scalar() or 0
    completed_auctions = db.query(func.count(Auction.id)).filter(Auction.status == "ended").scalar() or 0
    cancelled_auctions = db.query(func.count(Auction.id)).filter(Auction.status == "cancelled").scalar() or 0

    # ---------- RECENT ITEMS ----------
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(10).all()
    recent_listings = db.query(Product).order_by(Product.created_at.desc()).limit(8).all()
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(8).all()

    # ---------- PENDING INSPECTION REQUESTS ----------
    pending_inspection_requests = db.query(Product).filter(
        Product.status == "pending_inspection"
    ).order_by(Product.created_at.desc()).limit(5).all()

    # ---------- PENDING DELIVERY REQUESTS ----------
    pending_delivery_requests = db.query(Order).filter(
        Order.status.in_(["pending", "accepted"])
    ).order_by(Order.created_at.desc()).limit(5).all()

    # ---------- SERIALIZERS ----------
    def order_to_dict(order):
        return {
            "id": order.id,
            "farmer_name": order.product.farmer.name if order.product and order.product.farmer else "—",
            "trader_name": order.trader.name if order.trader else "—",
            "amount": float(order.total_price) if order.total_price else 0.0,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }

    def listing_to_dict(product):
        first_media = product.media[0] if product.media else None
        return {
            "id": product.id,
            "crop_name": product.name,
            "farmer_name": product.farmer.name if product.farmer else "—",
            "base_price": float(product.price) if product.price else 0.0,
            "status": product.status,
            "image": first_media.url if first_media else None,
        }

    def user_to_dict(user):
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }

    def inspection_request_to_dict(product):
        return {
            "id": product.id,
            "product_name": product.name,
            "farmer_name": product.farmer.name if product.farmer else "—",
            "quantity": product.quantity,
            "unit": product.unit,
            "location": product.location,
            "created_at": product.created_at.isoformat() if product.created_at else None,
        }

    def delivery_request_to_dict(order):
        return {
            "id": order.id,
            "order_id": order.id,
            "product_name": order.product.name if order.product else "—",
            "farmer_name": order.product.farmer.name if order.product and order.product.farmer else "—",
            "trader_name": order.trader.name if order.trader else "—",
            "quantity": order.quantity,
            "total_price": float(order.total_price) if order.total_price else 0.0,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }

    # ---------- RESPONSE ----------
    return {
        "stats": {
            "total_users": total_users,
            "total_farmers": total_farmers,
            "total_traders": total_traders,
            "active_listings": active_listings,
            "active_auctions": active_auctions,
            "pending_inspections": pending_inspections,
            "pending_deliveries": pending_deliveries,
            "pending_orders": pending_orders,
            "processing_orders": processing_orders,
            "completed_orders": completed_orders,
            "cancelled_orders": cancelled_orders,
            "users_growth": 0.0,
            "listings_growth": 0.0,
            "revenue_growth": 0.0,
            "auctions_growth": 0.0,
            "total_revenue": float(total_revenue),
        },
        "revenue": {
            "total": float(total_revenue),
            "chart": revenue_chart,
        },
        "auctions": {
            "live": live_auctions,
            "upcoming": upcoming_auctions,
            "completed": completed_auctions,
            "cancelled": cancelled_auctions,
        },
        "deliveries": {
            "pending": pending_deliveries,
            "assigned": assigned_deliveries,
            "in_transit": in_transit_deliveries,
            "delivered": delivered_deliveries,
        },
        "recent_orders": [order_to_dict(o) for o in recent_orders],
        "recent_listings": [listing_to_dict(l) for l in recent_listings],
        "recent_users": [user_to_dict(u) for u in recent_users],
        "pending_inspection_requests": [inspection_request_to_dict(p) for p in pending_inspection_requests],
        "pending_delivery_requests": [delivery_request_to_dict(o) for o in pending_delivery_requests],
    }