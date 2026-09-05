from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from ..database import get_db
from ..models.order import Order
from ..models.payment import PaymentTransaction
from ..models.user import User
from ..core.deps import require_role

router = APIRouter(prefix="/api/admin/revenue", tags=["admin-revenue"])

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
    else:  # 7d
        return now - timedelta(days=7)

@router.get("")
def get_revenue(
    period: str = Query("7d"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    start_date = get_period_start(period)

    # Base query for completed/delivered orders in period
    completed_orders_query = db.query(Order).filter(
        Order.status.in_(["completed", "delivered"]),
        Order.created_at >= start_date,
    )

    # Total revenue in period (sum of total_price)
    total_revenue = db.query(func.coalesce(func.sum(Order.total_price), 0.0)).filter(
        Order.status.in_(["completed", "delivered"]),
        Order.created_at >= start_date,
    ).scalar() or 0.0

    # Total orders in period (all statuses)
    total_orders = db.query(func.count(Order.id)).filter(
        Order.created_at >= start_date,
    ).scalar() or 0

    # Completed orders in period
    completed_orders = db.query(func.count(Order.id)).filter(
        Order.status.in_(["completed", "delivered"]),
        Order.created_at >= start_date,
    ).scalar() or 0

    # Average order value
    avg_order_value = float(total_revenue) / completed_orders if completed_orders else 0.0

    total_commission = 0.0
    pending_payouts = 0.0


    # Revenue chart data (daily revenue for period)
    chart = []
    if period == "24h":
        # For 24h, group by hour (simplified: just last 7 days? We'll do hourly)
        for i in range(24):
            hour_start = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24 - i)
            hour_end = hour_start + timedelta(hours=1)
            value = db.query(func.coalesce(func.sum(Order.total_price), 0.0)).filter(
                Order.created_at >= hour_start,
                Order.created_at < hour_end,
                Order.status.in_(["completed", "delivered"]),
            ).scalar() or 0.0
            chart.append({"label": hour_start.strftime("%H:%M"), "value": float(value)})
    else:
        # For 7d, 30d, 90d, 1y -> group by day
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
            chart.append({"label": day.strftime("%d %b"), "value": float(value)})

    # Transactions (orders) with pagination
    transactions_query = db.query(Order).order_by(Order.created_at.desc())
    total_transactions = transactions_query.count()
    orders = transactions_query.offset((page - 1) * limit).limit(limit).all()

    def order_to_dict(order):
        farmer_name = order.product.farmer.name if order.product and order.product.farmer else "—"
        trader_name = order.trader.name if order.trader else "—"
        return {
            "id": order.id,
            "order_id": order.id,
            "amount": float(order.total_price) if order.total_price else 0.0,
            "status": order.status,
            "payment_status": order.payment_status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "farmer_name": farmer_name,
            "trader_name": trader_name,
        }

    return {
        "summary": {
            "total_revenue": float(total_revenue),
            "total_orders": total_orders,
            "completed_orders": completed_orders,
            "average_order_value": avg_order_value,
            "total_commission": float(total_commission),
            "pending_payouts": float(pending_payouts),
        },
        "chart": chart,
        "transactions": [order_to_dict(o) for o in orders],
        "total": total_transactions,
        "page": page,
        "limit": limit,
    }