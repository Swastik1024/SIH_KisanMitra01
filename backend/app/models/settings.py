from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from sqlalchemy.sql import func
from ..database import Base

class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    platform_name = Column(String(100), default="KhetiKart")
    support_email = Column(String(255), default="support@khetikart.com")
    support_phone = Column(String(20), default="+91-9876543210")
    commission_rate = Column(Float, default=5.0)
    maintenance_mode = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())