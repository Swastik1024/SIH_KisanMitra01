from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models.user import User
from ..models.product import Product
from ..models.order import Order
from ..core.deps import get_current_user
from ..services.geocoding import geocode
from ..services.distance import road_distance

router = APIRouter(prefix="/api/farmer/orders", tags=["farmer-orders"])

class OrderCreate(BaseModel):
    product_id: int
    quantity: float = 1.0
    delivery_address: str
    delivery_city: str
    delivery_state: str
    delivery_pincode: str
    delivery_phone: str
    payment_method: str = "cod"
    payment_status: Optional[str] = None
    payment_transaction_id: Optional[str] = None

# Unit conversion to kg
UNIT_TO_KG = {
    "kg": 1.0,
    "quintal": 100.0,
    "ton": 1000.0,
    "gram": 0.001,
    "litre": 1.0,
    "unit": 1.0,
    "packet": 1.0,
    "box": 1.0,
}

PRODUCE_CATEGORIES = {"vegetables", "fruits", "grains", "pulses", "herbs"}

@router.post("")
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Allow both farmer and trader
    if current_user.role not in ["farmer", "trader"]:
        raise HTTPException(status_code=403, detail="Only farmers and traders can place orders")

    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status not in ["verified", "listed", "active"]:
        raise HTTPException(status_code=400, detail="Product is not available")
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    if product.quantity < data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient quantity available")

    product_total = product.price * data.quantity

    category_slug = product.category.slug if product.category else None

    # Delivery charge calculation (road distance for produce)
    if category_slug in PRODUCE_CATEGORIES:
        # Weight component
        unit_factor = UNIT_TO_KG.get(product.unit.lower(), 1.0)
        weight_kg = data.quantity * unit_factor
        weight_charge = round(weight_kg * 0.5, 2)

        # Distance component
        pickup_address = f"{product.location or ''}, {product.pincode or ''}, India".strip()
        delivery_address = f"{data.delivery_address}, {data.delivery_city}, {data.delivery_state}, {data.delivery_pincode}, India"

        pickup_coords = geocode(pickup_address)
        delivery_coords = geocode(delivery_address)

        distance_km = 0.0
        if pickup_coords and delivery_coords:
            distance_km = road_distance(*pickup_coords, *delivery_coords)

        distance_charge = round(distance_km * 2.0, 2)
        delivery_charge = weight_charge + distance_charge
    else:
        # Non-produce
        if product_total >= 10000:
            delivery_charge = 0.0
        else:
            delivery_charge = 100.0

    # Platform fee: 2% of product total, minimum ₹100 (only for farmer-seller produce)
    platform_fee = 0.0
    if product.farmer.role == "farmer":
        platform_fee = max(round(product_total * 0.02, 2), 100.0)

    total_price = product_total + delivery_charge + platform_fee

    # Payment status
    if data.payment_status is None:
        if data.payment_method == "cod":
            payment_status = "pending"
        else:
            payment_status = "held"
    else:
        payment_status = data.payment_status

    order = Order(
        product_id=product.id,
        trader_id=current_user.id,
        quantity=data.quantity,
        total_price=total_price,
        status="pending",
        payment_status=payment_status,
        delivery_address=data.delivery_address,
        delivery_city=data.delivery_city,
        delivery_state=data.delivery_state,
        delivery_pincode=data.delivery_pincode,
        delivery_phone=data.delivery_phone,
        payment_method=data.payment_method,
        delivery_charge=delivery_charge,
        platform_fee=platform_fee,
        payment_transaction_id=data.payment_transaction_id,
        delivery_commission=0.0,
    )
    db.add(order)

    product.quantity -= data.quantity
    if product.quantity <= 0:
        product.status = "sold"

    db.commit()
    db.refresh(order)

    return {
        "id": order.id,
        "product_id": order.product_id,
        "quantity": order.quantity,
        "total_price": order.total_price,
        "delivery_charge": order.delivery_charge,
        "platform_fee": order.platform_fee,
        "payment_status": order.payment_status,
        "status": order.status,
    }


@router.get("/my")
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .filter(Order.trader_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    def order_to_dict(order):
        return {
            "id": order.id,
            "product_name": order.product.name if order.product else "—",
            "quantity": order.quantity,
            "total_price": order.total_price,
            "delivery_charge": order.delivery_charge,
            "platform_fee": order.platform_fee,
            "payment_transaction_id": order.payment_transaction_id,
            "delivery_address": order.delivery_address,
            "delivery_city": order.delivery_city,
            "delivery_state": order.delivery_state,
            "delivery_pincode": order.delivery_pincode,
            "delivery_phone": order.delivery_phone,
            "payment_method": order.payment_method,
            "status": order.status,
            "payment_status": order.payment_status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }

    return [order_to_dict(o) for o in orders]