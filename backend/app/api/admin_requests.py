from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..database import get_db
from ..models.user import User
from ..models.product import Product, InspectionReport
from ..models.order import Order
from ..core.deps import require_role

router = APIRouter(prefix="/api/admin", tags=["admin-requests"])

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