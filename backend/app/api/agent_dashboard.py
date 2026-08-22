from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import json

from ..database import get_db
from ..models.user import User, AgentProfile
from ..models.order import Order, OrderDeliveryTracking
from ..models.product import Product, InspectionReport
from ..models.auction import Auction
from ..models.payment import Commission   # ✅ new import
from ..core.deps import require_role

router = APIRouter(prefix="/api/agent", tags=["agent"])

# ---------- Schemas ----------
class UpdateDeliveryStatus(BaseModel):
    status: str
    location: Optional[str] = None
    note: Optional[str] = None

class InspectionSubmit(BaseModel):
    quality_grade: str
    freshness_score: Optional[float] = None
    defect_rate: Optional[float] = None
    size_uniformity: Optional[str] = None
    color_ripeness: Optional[str] = None
    foreign_material: Optional[str] = None
    moisture: Optional[float] = None
    weight_estimate: Optional[float] = None
    confidence_score: Optional[float] = None
    recommendations: Optional[str] = None
    final_base_price: float
    notes: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    service_area: Optional[str] = None
    qualifications: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None

# ---------- Dashboard ----------
@router.get("/dashboard")
def agent_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent")),
):
    # Pending inspections
    pending_inspections = (
        db.query(InspectionReport)
        .filter(InspectionReport.agent_id == current_user.id)
        .join(Product, InspectionReport.product_id == Product.id)
        .filter(Product.status == "inspection_assigned")
        .count()
    )

    # Pending deliveries
    pending_deliveries = (
        db.query(Order)
        .filter(Order.agent_id == current_user.id)
        .filter(Order.status.in_(["accepted", "shipped", "out_for_delivery"]))
        .count()
    )

    # Completed deliveries
    completed_deliveries = (
        db.query(Order)
        .filter(Order.agent_id == current_user.id, Order.status == "delivered")
        .count()
    )

    # Completed inspections
    completed_inspections = (
        db.query(InspectionReport)
        .filter(InspectionReport.agent_id == current_user.id)
        .join(Product, InspectionReport.product_id == Product.id)
        .filter(Product.status == "verified")
        .count()
    )

    # Delivery commissions earned by this agent
    delivery_commissions = (
        db.query(func.coalesce(func.sum(Commission.amount), 0.0))
        .filter(Commission.agent_id == current_user.id)
        .scalar()
    ) or 0.0

    inspection_earnings = completed_inspections * 200.0
    total_earnings = inspection_earnings + float(delivery_commissions)

    # Only pending inspections
    recent_inspections = (
        db.query(Product)
        .options(joinedload(Product.category))
        .join(InspectionReport, InspectionReport.product_id == Product.id)
        .filter(InspectionReport.agent_id == current_user.id)
        .filter(Product.status == "inspection_assigned")
        .order_by(InspectionReport.inspection_date.desc())
        .limit(5)
        .all()
    )

    recent_deliveries = (
        db.query(Order)
        .filter(Order.agent_id == current_user.id)
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    def inspection_to_dict(product):
        report = product.inspection_report
        return {
            "id": product.id,
            "product_name": product.name,
            "farmer_name": product.farmer.name if product.farmer else "—",
            "quality_grade": report.quality_grade if report else None,
            "inspection_date": report.inspection_date.isoformat() if report and report.inspection_date else None,
            "status": product.status,
            "category_slug": product.category.slug if product.category else None,
        }

    def delivery_to_dict(order):
        return {
            "id": order.id,
            "product_name": order.product.name if order.product else "—",
            "buyer_name": order.trader.name if order.trader else "—",
            "delivery_address": order.delivery_address,
            "delivery_city": order.delivery_city,
            "delivery_pincode": order.delivery_pincode,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }

    return {
        "stats": {
            "pending_inspections": pending_inspections,
            "pending_deliveries": pending_deliveries,
            "completed_deliveries": completed_deliveries,
            "completed_inspections": completed_inspections,
            "total_earnings": float(total_earnings),
        },
        "recent_inspections": [inspection_to_dict(p) for p in recent_inspections],
        "recent_deliveries": [delivery_to_dict(o) for o in recent_deliveries],
    }

# ---------- Deliveries ----------
@router.get("/deliveries")
def list_agent_deliveries(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent")),
):
    query = db.query(Order).filter(Order.agent_id == current_user.id)
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(Order.created_at.desc()).all()

    def order_to_dict(order):
        return {
            "id": order.id,
            "product_name": order.product.name if order.product else "—",
            "buyer_name": order.trader.name if order.trader else "—",
            "delivery_address": order.delivery_address,
            "delivery_city": order.delivery_city,
            "delivery_state": order.delivery_state,
            "delivery_pincode": order.delivery_pincode,
            "delivery_phone": order.delivery_phone,
            "status": order.status,
            "payment_status": order.payment_status,
            "total_price": order.total_price,
            "delivery_commission": order.delivery_commission,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }
    return [order_to_dict(o) for o in orders]

@router.post("/deliveries/{order_id}/status")
def update_delivery_status(
    order_id: int,
    data: UpdateDeliveryStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent")),
):
    order = db.query(Order).filter(Order.id == order_id, Order.agent_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_statuses = ["accepted", "shipped", "out_for_delivery", "delivered", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    old_status = order.status
    order.status = data.status

    # Add tracking entry
    tracking = OrderDeliveryTracking(
        order_id=order.id,
        status=data.status,
        location=data.location,
        note=data.note,
        updated_by=current_user.id,
    )
    db.add(tracking)

    # ✅ On delivery completion, update payment status and credit delivery commission
    if data.status == "delivered":
        if order.payment_method == "cod":
            order.payment_status = "collected"
        else:
            order.payment_status = "released"

        # Credit delivery commission to agent (if not already credited)
        existing_commission = db.query(Commission).filter(
            Commission.order_id == order.id,
            Commission.agent_id == current_user.id,
        ).first()
        if not existing_commission and order.delivery_commission > 0:
            commission = Commission(
                order_id=order.id,
                agent_id=current_user.id,
                amount=order.delivery_commission,
                status="paid",
            )
            db.add(commission)

    db.commit()
    return {"message": f"Order status updated from {old_status} to {data.status}"}

# ---------- Inspections ----------
@router.get("/inspections")
def list_agent_inspections(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent")),
):
    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .join(InspectionReport, InspectionReport.product_id == Product.id)
        .filter(InspectionReport.agent_id == current_user.id)
        .order_by(InspectionReport.inspection_date.desc())
        .all()
    )

    def product_to_dict(product):
        report = product.inspection_report
        return {
            "id": product.id,
            "product_name": product.name,
            "farmer_name": product.farmer.name if product.farmer else "—",
            "quality_grade": report.quality_grade if report else None,
            "inspection_date": report.inspection_date.isoformat() if report and report.inspection_date else None,
            "status": product.status,
            "category_slug": product.category.slug if product.category else None,
            "inspection_data": json.loads(report.inspection_data) if report and report.inspection_data else {},
        }
    return [product_to_dict(p) for p in products]

@router.post("/inspections/{product_id}/submit")
def submit_inspection(
    product_id: int,
    data: InspectionSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent")),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    report = db.query(InspectionReport).filter(InspectionReport.product_id == product_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Inspection assignment not found")

    if report.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not assigned to this inspection")

    for field, value in data.dict(exclude={"parameters"}).items():
        setattr(report, field, value)

    if data.parameters:
        report.inspection_data = json.dumps(data.parameters)

    report.inspection_date = datetime.now(timezone.utc).replace(tzinfo=None)

    # ✅ Overwrite farmer's price with agent's final base price
    product.status = "verified"
    product.price = data.final_base_price

    # Update auction base price if auction exists, or create new auction
    if product.auction:
        product.auction.base_price = data.final_base_price
    else:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        start_time = product.auction_start_time if product.auction_start_time else now
        end_time = product.auction_end_time if product.auction_end_time else (now + timedelta(hours=24))
        auction_status = "live" if start_time <= now < end_time else "scheduled"

        auction = Auction(
            product_id=product.id,
            farmer_id=product.farmer_id,
            agent_id=current_user.id,
            base_price=data.final_base_price,
            start_time=start_time,
            end_time=end_time,
            status=auction_status,
        )
        db.add(auction)

    db.commit()
    return {"message": "Inspection report submitted successfully"}

# ---------- Profile ----------
@router.get("/profile")
def get_agent_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent")),
):
    agent_profile = current_user.agent_profile

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "service_area": agent_profile.service_area if agent_profile else None,
        "qualifications": agent_profile.qualifications if agent_profile else None,
        "bank_name": agent_profile.bank_name if agent_profile else None,
        "account_holder": agent_profile.account_holder if agent_profile else None,
        "account_number": agent_profile.account_number if agent_profile else None,
        "ifsc_code": agent_profile.ifsc_code if agent_profile else None,
    }

@router.put("/profile")
def update_agent_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent")),
):
    # Update User fields
    if data.name is not None:
        current_user.name = data.name
    if data.email is not None:
        current_user.email = data.email
    if data.phone is not None:
        current_user.phone = data.phone

    # Update or create AgentProfile
    agent_profile = current_user.agent_profile
    if not agent_profile:
        agent_profile = AgentProfile(user_id=current_user.id)
        db.add(agent_profile)

    if data.service_area is not None:
        agent_profile.service_area = data.service_area
    if data.qualifications is not None:
        agent_profile.qualifications = data.qualifications
    if data.bank_name is not None:
        agent_profile.bank_name = data.bank_name
    if data.account_holder is not None:
        agent_profile.account_holder = data.account_holder
    if data.account_number is not None:
        agent_profile.account_number = data.account_number
    if data.ifsc_code is not None:
        agent_profile.ifsc_code = data.ifsc_code

    db.commit()
    return {"message": "Profile updated successfully"}

# ---------- Tasks ----------
@router.get("/tasks")
def agent_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent")),
):
    # Pending inspections
    pending_inspections = (
        db.query(Product)
        .options(joinedload(Product.category))
        .join(InspectionReport, InspectionReport.product_id == Product.id)
        .filter(InspectionReport.agent_id == current_user.id)
        .filter(Product.status == "inspection_assigned")
        .order_by(InspectionReport.inspection_date.desc())
        .all()
    )

    # Pending deliveries
    pending_deliveries = (
        db.query(Order)
        .filter(Order.agent_id == current_user.id)
        .filter(Order.status.in_(["accepted", "shipped", "out_for_delivery"]))
        .order_by(Order.created_at.desc())
        .all()
    )

    def inspection_to_dict(product):
        report = product.inspection_report
        return {
            "id": product.id,
            "product_name": product.name,
            "farmer_name": product.farmer.name if product.farmer else "—",
            "status": product.status,
            "category_slug": product.category.slug if product.category else None,
        }

    def delivery_to_dict(order):
        return {
            "id": order.id,
            "product_name": order.product.name if order.product else "—",
            "buyer_name": order.trader.name if order.trader else "—",
            "delivery_address": order.delivery_address,
            "delivery_city": order.delivery_city,
            "delivery_pincode": order.delivery_pincode,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }

    return {
        "inspections": [inspection_to_dict(p) for p in pending_inspections],
        "deliveries": [delivery_to_dict(o) for o in pending_deliveries],
    }

# ---------- Earnings ----------
@router.get("/earnings")
def agent_earnings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent")),
):
    completed_inspections = (
        db.query(InspectionReport)
        .filter(InspectionReport.agent_id == current_user.id)
        .join(Product, InspectionReport.product_id == Product.id)
        .filter(Product.status == "verified")
        .count()
    )

    inspection_earnings = completed_inspections * 200.0

    completed_deliveries = (
        db.query(Order)
        .filter(Order.agent_id == current_user.id, Order.status == "delivered")
        .count()
    )

    # Sum of delivery commissions for this agent
    delivery_commissions = (
        db.query(func.coalesce(func.sum(Commission.amount), 0.0))
        .filter(Commission.agent_id == current_user.id)
        .scalar()
    ) or 0.0

    total_earnings = inspection_earnings + float(delivery_commissions)

    recent_completed_inspections = (
        db.query(Product)
        .options(joinedload(Product.category))
        .join(InspectionReport, InspectionReport.product_id == Product.id)
        .filter(InspectionReport.agent_id == current_user.id, Product.status == "verified")
        .order_by(InspectionReport.inspection_date.desc())
        .limit(10)
        .all()
    )

    recent_completed_deliveries = (
        db.query(Order)
        .filter(Order.agent_id == current_user.id, Order.status == "delivered")
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )

    def inspection_to_dict(product):
        report = product.inspection_report
        return {
            "id": product.id,
            "product_name": product.name,
            "farmer_name": product.farmer.name if product.farmer else "—",
            "quality_grade": report.quality_grade if report else None,
            "inspection_date": report.inspection_date.isoformat() if report and report.inspection_date else None,
            "category_slug": product.category.slug if product.category else None,
        }

    def delivery_to_dict(order):
        return {
            "id": order.id,
            "product_name": order.product.name if order.product else "—",
            "buyer_name": order.trader.name if order.trader else "—",
            "delivery_address": order.delivery_address,
            "delivery_city": order.delivery_city,
            "delivery_pincode": order.delivery_pincode,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }

    # Build transactions list (inspection + delivery commissions)
    transactions = []
    for product in recent_completed_inspections:
        report = product.inspection_report
        transactions.append({
            "id": f"insp_{product.id}",
            "type": "Inspection",
            "description": f"Inspection of {product.name}",
            "amount": 200.0,
            "date": report.inspection_date.isoformat() if report and report.inspection_date else None,
        })

    # Fetch delivery commission transactions
    delivery_commissions_records = (
        db.query(Commission)
        .filter(Commission.agent_id == current_user.id)
        .order_by(Commission.id.desc())
        .limit(10)
        .all()
    )
    for comm in delivery_commissions_records:
        order = comm.order
        transactions.append({
            "id": f"del_{comm.id}",
            "type": "Delivery Commission",
            "description": f"Delivery of {order.product.name if order and order.product else 'Order'}",
            "amount": comm.amount,
            "date": order.created_at.isoformat() if order and order.created_at else None,
        })

    transactions.sort(key=lambda x: x["date"] if x["date"] else "", reverse=True)

    return {
        "summary": {
            "completed_inspections": completed_inspections,
            "inspection_earnings": inspection_earnings,
            "completed_deliveries": completed_deliveries,
            "delivery_earnings": float(delivery_commissions),
            "total_earnings": float(total_earnings),
        },
        "recent_inspections": [inspection_to_dict(p) for p in recent_completed_inspections],
        "recent_deliveries": [delivery_to_dict(o) for o in recent_completed_deliveries],
        "transactions": transactions,
    }