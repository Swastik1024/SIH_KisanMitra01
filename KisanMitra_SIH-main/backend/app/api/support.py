from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.support import SupportTicket
from ..schemas.support import SupportTicketCreate, SupportTicketOut
from ..core.deps import get_current_user, require_role
from ..models.user import User

router = APIRouter(prefix="/api/support", tags=["support"])

@router.post("/tickets", response_model=SupportTicketOut)
def create_ticket(
    data: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=data.subject,
        description=data.description,
        status="open"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/tickets", response_model=List[SupportTicketOut])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(SupportTicket).filter(SupportTicket.user_id == current_user.id).all()

@router.get("/admin/tickets", response_model=List[SupportTicketOut])
def get_all_tickets(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    return db.query(SupportTicket).all()