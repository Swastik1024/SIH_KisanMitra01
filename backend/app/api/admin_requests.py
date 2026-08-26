from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..database import get_db
from ..models.user import User
from ..models.product import Product, InspectionReport
from ..models.order import Order
from ..core.deps import require_role

router = APIRouter(prefix="/api/admin", tags=["admin-requests"])

class AssignAgentRequest(BaseModel):
    agent_id: int

class AssignDeliveryAgentRequest(BaseModel):
    agent_id: int
    delivery_commission: float = 0.0   # ✅ new field for delivery commission

# ✅ List all agents for assignment dropdown
@router.get("/agents")
def list_agents(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    agents = db.query(User).filter(User.role == "agent").all()
    return {
        "agents": [
            {"id": a.id, "name": a.name, "email": a.email, "phone": a.phone}
            for a in agents
        ]
    }

# ✅ Assign agent to inspection request
@router.post("/inspection-requests/{product_id}/assign")
def assign_inspection_agent(
    product_id: int,
    data: AssignAgentRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    agent = db.query(User).filter(User.id == data.agent_id, User.role == "agent").first()
    if not agent:
        raise HTTPException(status_code=400, detail="Invalid agent")

    existing = db.query(InspectionReport).filter(InspectionReport.product_id == product.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inspection already assigned")

    report = InspectionReport(
        product_id=product.id,
        agent_id=agent.id,
        inspection_date=datetime.now(timezone.utc).replace(tzinfo=None),
        final_base_price=product.price,
    )
    db.add(report)
    product.status = "inspection_assigned"
    db.commit()
    return {"message": "Agent assigned to inspection request"}

# ✅ Reject inspection request
@router.post("/inspection-requests/{product_id}/reject")
def reject_inspection_request(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.status = "rejected"
    db.commit()
    return {"message": "Inspection request rejected"}

# ✅ Assign agent to delivery request (with delivery commission)
@router.post("/delivery-requests/{order_id}/assign")
def assign_delivery_agent(
    order_id: int,
    data: AssignDeliveryAgentRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    agent = db.query(User).filter(User.id == data.agent_id, User.role == "agent").first()
    if not agent:
        raise HTTPException(status_code=400, detail="Invalid agent")

    order.agent_id = agent.id
    order.status = "accepted"
    order.delivery_commission = data.delivery_commission   # ✅ set commission
    db.commit()
    return {"message": "Agent assigned to delivery request"}

# ✅ Reject delivery request
@router.post("/delivery-requests/{order_id}/reject")
def reject_delivery_request(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "cancelled"
    db.commit()
    return {"message": "Delivery request rejected"}