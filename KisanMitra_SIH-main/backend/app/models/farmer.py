from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    gender = Column(String(20))
    land_size = Column(String(100))
    address = Column(String(255))

    bank_name = Column(String(100))
    account_holder = Column(String(100))
    account_last4 = Column(String(4))

    aadhar_verified = Column(Boolean, default=False)
    pan_verified = Column(Boolean, default=False)
    farmer_id_verified = Column(Boolean, default=False)

    # ✅ New document fields (dummy verification)
    aadhar_document = Column(String(500), nullable=True)
    pan_document = Column(String(500), nullable=True)
    farmer_card_document = Column(String(500), nullable=True)
    document_verified = Column(Boolean, default=False)

    rating = Column(Float, default=0.0)

    user = relationship("User", back_populates="farmer_profile")