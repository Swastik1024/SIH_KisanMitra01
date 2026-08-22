from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.product import Product
from ..models.user import User
from ..core.deps import get_current_user
from ..services.geocoding import geocode
from ..services.distance import road_distance

router = APIRouter(prefix="/api/utils", tags=["utils"])

class DeliveryChargeRequest(BaseModel):
    product_id: int
    quantity: float
    delivery_address: str
    delivery_city: str
    delivery_state: str
    delivery_pincode: str

@router.post("/delivery-charge")
def calculate_delivery_charge(
    data: DeliveryChargeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

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

    category_slug = product.category.slug if product.category else None

    if category_slug not in PRODUCE_CATEGORIES:
        # Non-produce: existing rule
        subtotal = product.price * data.quantity
        if subtotal >= 10000:
            delivery_charge = 0.0
        else:
            delivery_charge = 100.0
        return {
            "delivery_charge": delivery_charge,
            "distance_km": 0.0,
            "weight_kg": 0.0,
            "weight_charge": 0.0,
            "distance_charge": 0.0,
        }

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

    return {
        "delivery_charge": delivery_charge,
        "distance_km": distance_km,
        "weight_kg": weight_kg,
        "weight_charge": weight_charge,
        "distance_charge": distance_charge,
    }