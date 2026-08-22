from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrderCreate(BaseModel):
    auction_id: int

class OrderOut(BaseModel):
    id: int
    product_id: int
    auction_id: Optional[int]
    trader_id: int
    agent_id: Optional[int]
    quantity: float
    total_price: float
    status: str
    payment_status: str
    
    created_at: datetime

    class Config:
        from_attributes = True

class DeliveryUpdate(BaseModel):
    status: str
    location: Optional[str] = None
    note: Optional[str] = None
    proof_image_url: Optional[str] = None