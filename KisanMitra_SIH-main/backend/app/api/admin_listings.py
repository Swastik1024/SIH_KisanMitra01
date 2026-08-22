from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models.product import Product
from ..core.deps import require_role
from ..models.user import User

router = APIRouter(prefix="/api/admin/listings", tags=["admin-listings"])

@router.get("")
def list_listings(
    search: str = Query("", description="Search by product name or farmer name"),
    status: str = Query("", description="Filter by status (active, pending_inspection, etc.)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """
    Admin endpoint to list all product listings.
    """
    query = db.query(Product).join(User, Product.farmer_id == User.id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                User.name.ilike(search_term),
            )
        )

    if status:
        query = query.filter(Product.status == status)

    total = query.count()
    listings = (
        query.order_by(Product.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    def listing_to_dict(product):
        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "quantity": product.quantity,
            "unit": product.unit,
            "price": product.price,
            "status": product.status,
            "location": product.location,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "farmer_name": product.farmer.name if product.farmer else "—",
            "farmer_email": product.farmer.email if product.farmer else "—",
            "farmer_phone": product.farmer.phone if product.farmer else "—",
            "category_slug": product.category_slug,
            "category_name": product.category.translations[0].name if product.category and product.category.translations else product.category.slug,
        }

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "listings": [listing_to_dict(l) for l in listings],
    }