from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.auction import Auction, Bid
from ..models.order import Order, OrderDeliveryTracking
from ..models.user import User
from ..schemas.order import OrderOut, DeliveryUpdate
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("/finalize-auction/{auction_id}", response_model=OrderOut)
def finalize_auction(
    auction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent"))
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status != "ended":
        raise HTTPException(status_code=400, detail="Auction not ended yet")
    if auction.current_highest_bidder_id is None:
        raise HTTPException(status_code=400, detail="No winning bid")
    
    # Check if order already exists
    existing_order = db.query(Order).filter(Order.auction_id == auction_id).first()
    if existing_order:
        raise HTTPException(status_code=400, detail="Order already created for this auction")
    
    # Create order
    order = Order(
        product_id=auction.product_id,
        auction_id=auction.id,
        trader_id=auction.current_highest_bidder_id,
        agent_id=auction.agent_id,
        quantity=auction.product.quantity,
        total_price=auction.current_highest_bid,
        status="pending",
        payment_status="pending"
    )
    db.add(order)
    auction.status = "completed"  # change from ended to completed? Keep ended, but mark order created
    db.commit()
    db.refresh(order)
    return order

@router.get("/my", response_model=List[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "trader":
        orders = db.query(Order).filter(Order.trader_id == current_user.id).all()
    elif current_user.role == "farmer":
        orders = db.query(Order).join(Order.product).filter(Order.product.has(farmer_id=current_user.id)).all()
    elif current_user.role == "agent":
        orders = db.query(Order).filter(Order.agent_id == current_user.id).all()
    else:
        orders = db.query(Order).all()
    return orders

@router.get("/all")
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Admin endpoint — returns all orders with product, trader, and payment details."""
    from sqlalchemy.orm import joinedload
    from ..models.product import Product
    orders = db.query(Order).options(
        joinedload(Order.product),
        joinedload(Order.trader),
    ).order_by(Order.created_at.desc()).all()

    result = []
    for o in orders:
        result.append({
            "id": o.id,
            "product": {"name": o.product.name if o.product else "—", "unit": o.product.unit if o.product else ""},
            "trader": {"name": o.trader.name if o.trader else "—"},
            "quantity": o.quantity,
            "total_price": o.total_price,
            "status": o.status,
            "payment_status": o.payment_status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })
    return result


@router.post("/{order_id}/delivery", response_model=OrderOut)
def update_delivery(
    order_id: int,
    delivery: DeliveryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Only agent or admin can update delivery
    if current_user.role not in ["agent", "admin"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    if current_user.role == "agent" and order.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your delivery")
    
    track = OrderDeliveryTracking(
        order_id=order_id,
        status=delivery.status,
        location=delivery.location,
        note=delivery.note,
        updated_by=current_user.id,
        proof_image_url=delivery.proof_image_url
    )
    db.add(track)
    # Update order status if delivery is delivered
    if delivery.status == "delivered":
        order.status = "delivered"
    db.commit()
    db.refresh(order)
    return order

@router.get("/{order_id}/tracking")
def get_order_tracking(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    tracks = db.query(OrderDeliveryTracking).filter(OrderDeliveryTracking.order_id == order_id).order_by(OrderDeliveryTracking.timestamp.asc()).all()

    # Predefined tracking steps
    all_steps = [
        {"key": "pending", "label": "Order Finalized", "description": "Winning bid confirmed & order created"},
        {"key": "packed", "label": "Packed at Farmer Hub", "description": "Goods inspected & packaged securely"},
        {"key": "shipped", "label": "Dispatched in Freight", "description": "In transit via agricultural logistics line"},
        {"key": "in_transit", "label": "Arrived at Regional APMC Center", "description": "Undergoing final weight check"},
        {"key": "out_for_delivery", "label": "Out for Last-Mile Delivery", "description": "Agent/Driver dispatched for delivery"},
        {"key": "delivered", "label": "Delivered & Verified", "description": "Funds released from Escrow"}
    ]

    current_status = (order.status or "pending").lower()
    
    status_map = {
        "pending": 0,
        "accepted": 1,
        "packed": 1,
        "shipped": 2,
        "in_transit": 3,
        "out_for_delivery": 4,
        "delivered": 5
    }
    
    active_step_index = status_map.get(current_status, 0)

    formatted_history = [
        {
            "id": t.id,
            "status": t.status,
            "location": t.location or "En Route",
            "note": t.note or "Status updated",
            "timestamp": t.timestamp.strftime("%b %d, %Y %I:%M %p") if t.timestamp else None,
            "proof_image_url": t.proof_image_url
        } for t in tracks
    ]

    return {
        "order_id": order.id,
        "product_name": order.product.name if order.product else "Crop Order",
        "quantity": order.quantity,
        "total_price": order.total_price,
        "order_status": order.status,
        "payment_status": order.payment_status,
        "delivery_address": f"{order.delivery_address or 'APMC Market Yard'}, {order.delivery_city or ''} {order.delivery_pincode or ''}".strip(),
        "courier_partner": "KisanMitra Express Agri Logistics",
        "tracking_number": f"KM-LOG-{order.id:06d}",
        "estimated_delivery": "Within 24-48 Hours",
        "current_step_index": active_step_index,
        "steps": all_steps,
        "checkpoint_history": formatted_history
    }