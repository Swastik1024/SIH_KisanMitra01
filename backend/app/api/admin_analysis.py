from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from ..database import get_db
from ..models.user import User
from ..models.product import Product, Category, CategoryTranslation
from ..models.order import Order
from ..models.auction import Auction
from ..core.deps import require_role

router = APIRouter(prefix="/api/admin/analysis", tags=["admin-analysis"])

def get_period_start(period: str) -> datetime:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if period == "24h":
        return now - timedelta(hours=24)
    elif period == "30d":
        return now - timedelta(days=30)
    elif period == "90d":
        return now - timedelta(days=90)
    elif period == "1y":
        return now - timedelta(days=365)
    else:  # default 7d
        return now - timedelta(days=7)

@router.get("")
def get_analysis(
    period: str = Query("7d"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    start_date = get_period_start(period)

    # Summary counts
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_farmers = db.query(func.count(User.id)).filter(User.role == "farmer").scalar() or 0
    total_traders = db.query(func.count(User.id)).filter(User.role == "trader").scalar() or 0
    total_agents = db.query(func.count(User.id)).filter(User.role == "agent").scalar() or 0
    active_listings = db.query(func.count(Product.id)).filter(Product.status == "active").scalar() or 0
    active_auctions = db.query(func.count(Auction.id)).filter(Auction.status == "live").scalar() or 0

    # Revenue and orders
    total_revenue = db.query(func.coalesce(func.sum(Order.total_price), 0.0)).filter(
        Order.status.in_(["completed", "delivered"]),
        Order.created_at >= start_date,
    ).scalar() or 0.0

    total_orders = db.query(func.count(Order.id)).filter(
        Order.created_at >= start_date,
    ).scalar() or 0

    completed_orders = db.query(func.count(Order.id)).filter(
        Order.status.in_(["completed", "delivered"]),
        Order.created_at >= start_date,
    ).scalar() or 0

    cancelled_orders = db.query(func.count(Order.id)).filter(
        Order.status == "cancelled",
        Order.created_at >= start_date,
    ).scalar() or 0

    # Order status distribution
    status_rows = db.query(Order.status, func.count(Order.id)).filter(
        Order.created_at >= start_date,
    ).group_by(Order.status).all()
    order_status_distribution = [{"status": s, "count": c} for s, c in status_rows]

    # User growth over period (daily)
    user_growth = []
    if period == "24h":
        for i in range(24):
            hour_start = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24 - i)
            hour_end = hour_start + timedelta(hours=1)
            count = db.query(func.count(User.id)).filter(
                User.created_at >= hour_start,
                User.created_at < hour_end,
            ).scalar() or 0
            user_growth.append({"label": hour_start.strftime("%H:%M"), "count": count})
    else:
        days = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365,
        }.get(period, 7)
        for i in range(days - 1, -1, -1):
            day = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            count = db.query(func.count(User.id)).filter(
                User.created_at >= day_start,
                User.created_at < day_end,
            ).scalar() or 0
            user_growth.append({"label": day.strftime("%d %b"), "count": count})

    # Revenue trend over period
    revenue_trend = []
    if period == "24h":
        for i in range(24):
            hour_start = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24 - i)
            hour_end = hour_start + timedelta(hours=1)
            value = db.query(func.coalesce(func.sum(Order.total_price), 0.0)).filter(
                Order.created_at >= hour_start,
                Order.created_at < hour_end,
                Order.status.in_(["completed", "delivered"]),
            ).scalar() or 0.0
            revenue_trend.append({"label": hour_start.strftime("%H:%M"), "value": float(value)})
    else:
        days = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365,
        }.get(period, 7)
        for i in range(days - 1, -1, -1):
            day = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            value = db.query(func.coalesce(func.sum(Order.total_price), 0.0)).filter(
                Order.created_at >= day_start,
                Order.created_at < day_end,
                Order.status.in_(["completed", "delivered"]),
            ).scalar() or 0.0
            revenue_trend.append({"label": day.strftime("%d %b"), "value": float(value)})

    # Top categories by product count
    top_categories_query = db.query(
        Category.id,
        CategoryTranslation.name.label("category_name"),
        func.count(Product.id).label("product_count")
    ).join(Product, Product.category_id == Category.id) \
     .join(CategoryTranslation, CategoryTranslation.category_id == Category.id) \
     .filter(CategoryTranslation.language == "en") \
     .group_by(Category.id, CategoryTranslation.name) \
     .order_by(func.count(Product.id).desc()) \
     .limit(5).all()
    top_categories = [
        {"id": c.id, "name": c.category_name, "count": c.product_count}
        for c in top_categories_query
    ]

    # Top products by order count
    top_products_query = db.query(
        Product.id,
        Product.name,
        func.count(Order.id).label("order_count")
    ).join(Order, Order.product_id == Product.id) \
     .filter(Order.created_at >= start_date) \
     .group_by(Product.id, Product.name) \
     .order_by(func.count(Order.id).desc()) \
     .limit(5).all()
    top_products = [
        {"id": p.id, "name": p.name, "orders": p.order_count}
        for p in top_products_query
    ]

    return {
        "summary": {
            "total_users": total_users,
            "total_farmers": total_farmers,
            "total_traders": total_traders,
            "total_agents": total_agents,
            "active_listings": active_listings,
            "active_auctions": active_auctions,
            "total_revenue": float(total_revenue),
            "total_orders": total_orders,
            "completed_orders": completed_orders,
            "cancelled_orders": cancelled_orders,
        },
        "order_status_distribution": order_status_distribution,
        "user_growth": user_growth,
        "revenue_trend": revenue_trend,
        "top_categories": top_categories,
        "top_products": top_products,
    }