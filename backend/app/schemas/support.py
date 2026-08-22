from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupportTicketCreate(BaseModel):
    subject: str
    description: str

class SupportTicketOut(BaseModel):
    id: int
    user_id: int
    subject: str
    description: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True