from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.settings import PlatformSetting
from ..models.user import User
from ..core.deps import require_role

router = APIRouter(prefix="/api/admin/settings", tags=["admin-settings"])

class SettingsUpdate(BaseModel):
    platform_name: Optional[str] = None
    support_email: Optional[str] = None
    support_phone: Optional[str] = None
    commission_rate: Optional[float] = None
    maintenance_mode: Optional[bool] = None

def get_or_create_settings(db: Session) -> PlatformSetting:
    settings = db.query(PlatformSetting).first()
    if not settings:
        settings = PlatformSetting()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("")
def get_settings(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    settings = get_or_create_settings(db)
    return {
        "id": settings.id,
        "platform_name": settings.platform_name,
        "support_email": settings.support_email,
        "support_phone": settings.support_phone,
        "commission_rate": settings.commission_rate,
        "maintenance_mode": settings.maintenance_mode,
    }

@router.put("")
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    settings = get_or_create_settings(db)

    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return {
        "id": settings.id,
        "platform_name": settings.platform_name,
        "support_email": settings.support_email,
        "support_phone": settings.support_phone,
        "commission_rate": settings.commission_rate,
        "maintenance_mode": settings.maintenance_mode,
    }