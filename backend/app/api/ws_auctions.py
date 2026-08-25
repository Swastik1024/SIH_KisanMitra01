from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, Set
import asyncio
import json
from datetime import datetime, timedelta, timezone
from ..database import SessionLocal
from ..models.auction import Auction, Bid
from ..models.user import User
from ..core.security import decode_access_token

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.auction_connections: Dict[int, Set[WebSocket]] = {}
        self.user_ws: Dict[int, WebSocket] = {}

    async def connect(self, auction_id: int, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if auction_id not in self.auction_connections:
            self.auction_connections[auction_id] = set()
        self.auction_connections[auction_id].add(websocket)
        self.user_ws[user_id] = websocket

    def disconnect(self, auction_id: int, websocket: WebSocket):
        if auction_id in self.auction_connections:
            self.auction_connections[auction_id].discard(websocket)
            if not self.auction_connections[auction_id]:
                del self.auction_connections[auction_id]
        # Remove user mapping if this was their only connection
        for uid, ws in list(self.user_ws.items()):
            if ws == websocket:
                del self.user_ws[uid]

    async def broadcast_to_auction(self, auction_id: int, message: dict):
        if auction_id in self.auction_connections:
            for ws in self.auction_connections[auction_id]:
                await ws.send_json(message)

    async def send_personal(self, user_id: int, message: dict):
        ws = self.user_ws.get(user_id)
        if ws:
            await ws.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/auctions/{auction_id}")
async def auction_websocket(websocket: WebSocket, auction_id: int):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=1008)
        return
    user_id = int(payload.get("sub"))
    role = payload.get("role")
    if role not in ["trader", "farmer", "agent", "admin"]:
        await websocket.close(code=1008)
        return

    db = SessionLocal()
    try:
        auction = db.query(Auction).filter(Auction.id == auction_id).first()
        if not auction:
            await websocket.close(code=1008)
            return
        await manager.connect(auction_id, websocket, user_id)

        # Send initial state
        await websocket.send_json({
            "type": "auction_state",
            "data": {
                "auction_id": auction.id,
                "product_id": auction.product_id,
                "base_price": auction.base_price,
                "current_highest_bid": auction.current_highest_bid,
                "current_highest_bidder_id": auction.current_highest_bidder_id,
                "end_time": auction.end_time.isoformat(),
                "status": auction.status,
                "min_bid_increment": auction.min_bid_increment
            }
        })

        try:
            while True:
                data = await websocket.receive_json()
                if data["type"] == "place_bid":
                    if role != "trader":
                        await websocket.send_json({"type": "error", "message": "Only traders can bid"})
                        continue
                    bid_amount = data["bid_amount"]
                    db.refresh(auction)
                    now = datetime.now(timezone.utc).replace(tzinfo=None)
                    if auction.status != "live" or now < auction.start_time or now > auction.end_time:
                        await websocket.send_json({"type": "error", "message": "Auction not active"})
                        continue
                    if user_id == auction.farmer_id:
                        await websocket.send_json({"type": "error", "message": "Farmers cannot bid on their own produce"})
                        continue

                    previous_bidder_id = auction.current_highest_bidder_id

                    if auction.current_highest_bid and bid_amount <= auction.current_highest_bid:
                        await websocket.send_json({"type": "error", "message": "Bid must be higher than current highest bid"})
                        continue
                    if bid_amount < auction.base_price:
                        await websocket.send_json({"type": "error", "message": "Bid below base price"})
                        continue
                    if auction.current_highest_bid and bid_amount < auction.current_highest_bid + auction.min_bid_increment:
                        await websocket.send_json({"type": "error", "message": f"Minimum increment is {auction.min_bid_increment}"})
                        continue
                    # Auto-extension
                    if auction.auto_extension_enabled and auction.end_time - now <= timedelta(minutes=2):
                        auction.end_time = now + timedelta(minutes=5)
                    bid = Bid(
                        auction_id=auction_id,
                        bidder_id=user_id,
                        bid_amount=bid_amount,
                        is_winning=True
                    )
                    db.add(bid)
                    # Reset winning flag on all bids for this auction
                    db.query(Bid).filter(Bid.auction_id == auction_id).update({"is_winning": False})
                    auction.current_highest_bid = bid_amount
                    auction.current_highest_bidder_id = user_id

                    # Create outbid notification if there was a previous bidder
                    if previous_bidder_id and previous_bidder_id != user_id:
                        from ..models.notification import Notification
                        prod_name = auction.product.name if auction.product else "Crop"
                        db.add(Notification(
                            user_id=previous_bidder_id,
                            type="outbid_alert",
                            message=f"You have been outbid on '{prod_name}'. New highest bid is ₹{bid_amount}."
                        ))

                    db.commit()
                    db.refresh(bid)
                    await manager.broadcast_to_auction(auction_id, {
                        "type": "new_bid",
                        "data": {
                            "bidder_id": user_id,
                            "bid_amount": bid_amount,
                            "bid_time": bid.bid_time.isoformat(),
                            "current_highest_bid": bid_amount,
                            "current_highest_bidder_id": user_id,
                            "end_time": auction.end_time.isoformat()
                        }
                    })
                elif data["type"] == "ping":
                    await websocket.send_json({"type": "pong"})
        except WebSocketDisconnect:
            manager.disconnect(auction_id, websocket)
    finally:
        db.close()