from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    language = Column(String(10), default='en')
    location = Column(String(255))
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    trader_license = relationship("TraderLicense", back_populates="user", uselist=False, cascade="all, delete-orphan")
    agent_profile = relationship("AgentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="user")
    products = relationship("Product", foreign_keys="Product.farmer_id", back_populates="farmer")
    media_uploads = relationship("ProductMedia", back_populates="uploader")
    inspections = relationship("InspectionReport", back_populates="agent")
    auctions_as_farmer = relationship("Auction", foreign_keys="Auction.farmer_id", back_populates="farmer")
    auctions_as_agent = relationship("Auction", foreign_keys="Auction.agent_id", back_populates="agent")
    bids = relationship("Bid", back_populates="bidder")
    orders_as_trader = relationship("Order", foreign_keys="Order.trader_id", back_populates="trader")
    orders_as_agent = relationship("Order", foreign_keys="Order.agent_id", back_populates="agent")
    delivery_updates = relationship("OrderDeliveryTracking", back_populates="updater")
    payouts = relationship("Payout", back_populates="user")
    commissions = relationship("Commission", back_populates="agent")
    notifications = relationship("Notification", back_populates="user")


class TraderLicense(Base):
    __tablename__ = "trader_licenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    licence_number = Column(String(100), nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=False)

    # ✅ Document fields (dummy verification)
    aadhar_document = Column(String(500), nullable=True)
    pan_document = Column(String(500), nullable=True)
    trading_licence_document = Column(String(500), nullable=True)
    document_verified = Column(Boolean, default=False)

    user = relationship("User", back_populates="trader_license")


class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    service_area = Column(String(255))
    commission_rate = Column(Float, default=0.0)  # percentage
    qualifications = Column(Text, nullable=True)
    bank_name = Column(String(100), nullable=True)
    account_holder = Column(String(100), nullable=True)
    account_number = Column(String(20), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    is_approved = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)

    user = relationship("User", back_populates="agent_profile")