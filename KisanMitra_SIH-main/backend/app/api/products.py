from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List
import json

from ..database import get_db
from ..models.product import Product, ProductMedia, Category
from ..models.user import User
from ..models.auction import Auction, Bid
from ..models.order import Order   # ✅ new import
from ..schemas.product import ProductCreate, ProductOut, MediaUpload
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/products", tags=["products"])

@router.post("/", response_model=ProductOut)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["farmer", "admin"]:
        raise HTTPException(status_code=403, detail="Only farmers and admins can create products")

    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    product = Product(
        farmer_id=current_user.id,
        category_id=data.category_id,
        name=data.name,
        description=data.description,
        quantity=data.quantity,
        unit=data.unit,
        price=data.price,
        rating=0.0,
        location=data.location,
        pincode=data.pincode,
        available_date=data.available_date,
        auction_type=data.auction_type,
        auction_start_time=data.auction_start_time,
        auction_end_time=data.auction_end_time,
        status="pending_inspection"
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("/my")
def get_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get products for the current user. For farmers, returns their products.
    Includes buyer_name for sold products.
    """
    if current_user.role == "farmer":
        products = db.query(Product).options(
            joinedload(Product.media),
            joinedload(Product.category),
            joinedload(Product.inspection_report),
        ).filter(Product.farmer_id == current_user.id).all()
    else:
        products = db.query(Product).options(
            joinedload(Product.media),
            joinedload(Product.category),
            joinedload(Product.inspection_report),
        ).all()

    result = []
    for p in products:
        buyer_name = None
        if p.status == "sold":
            # Get the latest order for this product to find the buyer
            order = db.query(Order).filter(Order.product_id == p.id).order_by(Order.created_at.desc()).first()
            if order and order.trader:
                buyer_name = order.trader.name

        first_media = p.media[0] if p.media else None
        image_url = first_media.url if first_media else None

        result.append({
            "id": p.id,
            "farmer_id": p.farmer_id,
            "category_id": p.category_id,
            "name": p.name,
            "description": p.description,
            "quantity": p.quantity,
            "unit": p.unit,
            "price": p.price,
            "rating": p.rating,
            "status": p.status,
            "location": p.location,
            "pincode": p.pincode,
            "available_date": p.available_date.isoformat() if p.available_date else None,
            "auction_type": p.auction_type,
            "auction_start_time": p.auction_start_time.isoformat() if p.auction_start_time else None,
            "auction_end_time": p.auction_end_time.isoformat() if p.auction_end_time else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "category_slug": p.category.slug if p.category else None,
            "image": image_url,
            "media": [
                {"media_type": m.media_type, "url": m.url}
                for m in p.media
            ],
            "inspection_report": {
                "quality_grade": p.inspection_report.quality_grade if p.inspection_report else None,
                "final_base_price": p.inspection_report.final_base_price if p.inspection_report else None,
                "recommendations": p.inspection_report.recommendations if p.inspection_report else None,
                "notes": p.inspection_report.notes if p.inspection_report else None,
                "inspection_data": json.loads(p.inspection_report.inspection_data) if p.inspection_report and p.inspection_report.inspection_data else {},
            },
            "buyer_name": buyer_name,   # ✅ added
        })

    return result

@router.get("/", response_model=List[dict])
def get_available_products(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all products available for purchase (active/verified/listed).
    """
    products = db.query(Product).options(
        joinedload(Product.media),
        joinedload(Product.category),
        joinedload(Product.auction),
    ).filter(Product.status.in_(["verified", "listed", "active"])).all()

    result = []
    for p in products:
        image_url = None
        if p.media:
            image_url = p.media[0].url
            if image_url and image_url.startswith('/'):
                image_url = f"{request.base_url}{image_url.lstrip('/')}"

        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "quantity": p.quantity,
            "unit": p.unit,
            "price": p.price,
            "status": p.status,
            "category_slug": p.category.slug if p.category else None,
            "image": image_url,
            "auction_type": p.auction_type,
            "current_highest_bid": p.auction.current_highest_bid if p.auction else None,
        })

    return result

@router.get("/{product_id}")
def get_product(
    product_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get full product details, including inspection report and auction bids.
    """
    product = db.query(Product).options(
        joinedload(Product.media),
        joinedload(Product.category),
        joinedload(Product.inspection_report),
        joinedload(Product.auction).selectinload(Auction.bids).joinedload(Bid.bidder),
    ).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    first_media = product.media[0] if product.media else None
    image_url = first_media.url if first_media else None
    if image_url and image_url.startswith('/'):
        image_url = f"{request.base_url}{image_url.lstrip('/')}"

    inspection_report = product.inspection_report
    inspection_data = {}
    if inspection_report and inspection_report.inspection_data:
        inspection_data = json.loads(inspection_report.inspection_data)

    bids = []
    if product.auction and product.auction.bids:
        for bid in product.auction.bids:
            bids.append({
                "id": bid.id,
                "bidder_name": bid.bidder.name if bid.bidder else "—",
                "bid_amount": bid.bid_amount,
                "bid_time": bid.bid_time.isoformat() if bid.bid_time else None,
                "is_winning": bid.is_winning,
            })

    # ✅ Get buyer name if sold
    buyer_name = None
    if product.status == "sold":
        order = db.query(Order).filter(Order.product_id == product.id).order_by(Order.created_at.desc()).first()
        if order and order.trader:
            buyer_name = order.trader.name

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "quantity": product.quantity,
        "unit": product.unit,
        "price": product.price,
        "status": product.status,
        "category_slug": product.category.slug if product.category else None,
        "auction_type": product.auction_type,
        "image": image_url,
        "farmer_name": product.farmer.name if product.farmer else None,
        "current_highest_bid": product.auction.current_highest_bid if product.auction else None,
        "base_price": product.auction.base_price if product.auction else None,
        "inspection_report": {
            "quality_grade": inspection_report.quality_grade if inspection_report else None,
            "final_base_price": inspection_report.final_base_price if inspection_report else None,
            "recommendations": inspection_report.recommendations if inspection_report else None,
            "notes": inspection_report.notes if inspection_report else None,
            "inspection_data": inspection_data,
        },
        "bids": bids,
        "buyer_name": buyer_name,   # ✅ added
    }

@router.post("/{product_id}/media", response_model=ProductOut)
def upload_media(
    product_id: int,
    media: MediaUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if current_user.role not in ["farmer", "agent", "admin"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    if current_user.role == "farmer" and product.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your product")

    media_entry = ProductMedia(
        product_id=product_id,
        media_type=media.media_type,
        url=media.url,
        uploaded_by=current_user.id
    )
    db.add(media_entry)
    db.commit()
    db.refresh(product)
    return product