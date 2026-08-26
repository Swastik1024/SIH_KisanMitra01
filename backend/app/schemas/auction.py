from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .product import ProductPublicOut

class AuctionCreate(BaseModel):
    product_id: int
    reserve_price: Optional[float] = None
    start_time: datetime
    end_time: datetime
    min_bid_increment: float = 10.0
    auto_extension_enabled: bool = True

class AuctionOut(BaseModel):
    id: int
    product_id: int
    farmer_id: int
    agent_id: int
    base_price: float
    reserve_price: Optional[float]
    start_time: datetime
    end_time: datetime
    current_highest_bid: Optional[float]
    current_highest_bidder_id: Optional[int]
    status: str
    min_bid_increment: float
    auto_extension_enabled: bool
    product: ProductPublicOut  # <-- added

    class Config:
        from_attributes = True

class BidCreate(BaseModel):
    bid_amount: float

class BidOut(BaseModel):
    id: int
    auction_id: int
    bidder_id: int
    bid_amount: float
    bid_time: datetime
    is_winning: bool

    class Config:
        from_attributes = True