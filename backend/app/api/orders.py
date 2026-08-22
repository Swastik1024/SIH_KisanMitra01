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
        # Farmer sees orders related to their products
        orders = db.query(Order).join(Order.product).filter(Order.product.has(farmer_id=current_user.id)).all()
    elif current_user.role == "agent":
        orders = db.query(Order).filter(Order.agent_id == current_user.id).all()
    else:
        orders = db.query(Order).all()
    return orders

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