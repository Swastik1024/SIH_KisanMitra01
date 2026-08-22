from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models.product import Product, Category
from ..models.user import User
from ..core.deps import require_role

router = APIRouter(prefix="/api/admin/products", tags=["admin-products"])

class AdminProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: float
    unit: str
    price: float
    category_slug: str          # e.g., "medical" or "instruments"
    location: Optional[str] = None
    pincode: Optional[str] = None
    image_url: Optional[str] = None

@router.post("")
def create_product(
    data: AdminProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    # Find category by slug
    category = db.query(Category).filter(Category.slug == data.category_slug).first()
    if not category:
        raise HTTPException(status_code=400, detail=f"Category '{data.category_slug}' not found")

    product = Product(
        name=data.name,
        description=data.description,
        quantity=data.quantity,
        unit=data.unit,
        price=data.price,
        category_id=category.id,
        location=data.location,
        pincode=data.pincode,
        status="active",
        farmer_id=admin.id,   # placeholder; could be admin id or a system farmer
        auction_type="fixed",
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # If image_url provided, insert into ProductMedia
    if data.image_url:
        from ..models.product import ProductMedia
        media = ProductMedia(
            product_id=product.id,
            media_type="image",
            url=data.image_url,
            uploaded_by=admin.id,
        )
        db.add(media)
        db.commit()

    return {
        "id": product.id,
        "name": product.name,
        "price": product.price,
        "category_slug": data.category_slug,
    }