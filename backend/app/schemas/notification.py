from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    user_id: int
    type: str
    message: str

class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: Optional[str] = None
    message: str
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
