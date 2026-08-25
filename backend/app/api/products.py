from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List
import json

from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from ..database import get_db
from ..models.product import Product, ProductMedia, Category
from ..models.user import User
from ..models.auction import Auction, Bid
from ..models.order import Order   # ✅ new import
from ..schemas.product import ProductCreate, ProductOut, MediaUpload, ProductUpdate
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
                "inspection_data": (
                    p.inspection_report.inspection_data
                    if isinstance(getattr(p.inspection_report, "inspection_data", None), dict)
                    else (
                        json.loads(p.inspection_report.inspection_data)
                        if p.inspection_report and p.inspection_report.inspection_data and isinstance(p.inspection_report.inspection_data, str)
                        else {}
                    )
                ),
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

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    result = []
    for p in products:
        is_auction = p.auction_type and p.auction_type not in ["fixed", "fixed_price"]
        if is_auction and p.auction:
            if p.auction.end_time and now > p.auction.end_time:
                continue
            if p.auction.status in ["ended", "completed", "cancelled"]:
                continue

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
            "end_time": p.auction.end_time.isoformat() if p.auction and p.auction.end_time else None,
            "start_time": p.auction.start_time.isoformat() if p.auction and p.auction.start_time else None,
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
        if isinstance(inspection_report.inspection_data, dict):
            inspection_data = inspection_report.inspection_data
        elif isinstance(inspection_report.inspection_data, str):
            try:
                inspection_data = json.loads(inspection_report.inspection_data)
            except Exception:
                inspection_data = {}

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
            "freshness_score": inspection_report.freshness_score if inspection_report else None,
            "defect_rate": inspection_report.defect_rate if inspection_report else None,
            "inspection_data": inspection_data,
        } if inspection_report else None,
        "bids": bids,
        "buyer_name": buyer_name,
        "auction_id": product.auction.id if product.auction else None,
        "end_time": product.auction.end_time.isoformat() if product.auction and product.auction.end_time else None,
        "start_time": product.auction.start_time.isoformat() if product.auction and product.auction.start_time else None,
    }

class ProductBidRequest(BaseModel):
    bid_amount: float

@router.post("/{product_id}/bid")
def place_product_bid(
    product_id: int,
    bid_data: ProductBidRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("trader"))
):
    product = db.query(Product).options(joinedload(Product.auction)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.auction:
        raise HTTPException(status_code=400, detail="Product does not have an active auction")
    
    auction = product.auction
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if auction.end_time and now > auction.end_time:
        auction.status = "ended"
        db.commit()
        raise HTTPException(status_code=400, detail="Auction has ended")
    
    if auction.status in ["scheduled", "active", "live"]:
        if auction.status != "live":
            auction.status = "live"
            if auction.start_time > now:
                auction.start_time = now
    else:
        raise HTTPException(status_code=400, detail="Auction is not active")
    
    if current_user.id == auction.farmer_id:
        raise HTTPException(status_code=400, detail="Farmers cannot bid on their own produce")

    previous_highest_bidder_id = auction.current_highest_bidder_id

    if auction.current_highest_bid is not None and bid_data.bid_amount <= auction.current_highest_bid:
        raise HTTPException(status_code=400, detail=f"Bid must be higher than current bid (₹{auction.current_highest_bid})")
    if bid_data.bid_amount < auction.base_price:
        raise HTTPException(status_code=400, detail=f"Bid must be at least base price (₹{auction.base_price})")
    
    if auction.current_highest_bid is not None and bid_data.bid_amount < auction.current_highest_bid + auction.min_bid_increment:
        raise HTTPException(status_code=400, detail=f"Bid must be at least ₹{auction.min_bid_increment} more than current bid")
    
    if auction.auto_extension_enabled and auction.end_time - now <= timedelta(minutes=2):
        auction.end_time = now + timedelta(minutes=5)
    
    bid = Bid(
        auction_id=auction.id,
        bidder_id=current_user.id,
        bid_amount=bid_data.bid_amount,
        is_winning=True
    )
    # Reset winning flag on older bids
    db.query(Bid).filter(Bid.auction_id == auction.id).update({"is_winning": False})
    db.add(bid)
    auction.current_highest_bid = bid_data.bid_amount
    auction.current_highest_bidder_id = current_user.id

    if previous_highest_bidder_id and previous_highest_bidder_id != current_user.id:
        from ..models.notification import Notification
        db.add(Notification(
            user_id=previous_highest_bidder_id,
            type="outbid_alert",
            message=f"You have been outbid on '{product.name}'. The new highest bid is ₹{bid_data.bid_amount}."
        ))

    db.commit()
    db.refresh(bid)
    return {"message": "Bid placed successfully", "bid_amount": bid.bid_amount, "bid_id": bid.id}


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

@router.put("/{product_id}")
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if current_user.role not in ["farmer", "admin"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    if current_user.role == "farmer" and product.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your product")

    if data.name is not None:
        product.name = data.name
    if data.description is not None:
        product.description = data.description
    if data.quantity is not None:
        product.quantity = data.quantity
    if data.unit is not None:
        product.unit = data.unit
    if data.price is not None:
        product.price = data.price
    if data.location is not None:
        product.location = data.location
    if data.pincode is not None:
        product.pincode = data.pincode

    db.commit()
    db.refresh(product)
    return {
        "message": "Product updated successfully",
        "product_id": product.id,
        "name": product.name,
        "price": product.price,
        "quantity": product.quantity,
        "unit": product.unit
    }

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if current_user.role not in ["farmer", "admin"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    if current_user.role == "farmer" and product.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your product")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}