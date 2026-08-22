from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Auction(Base):
    __tablename__ = "auctions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    base_price = Column(Float, nullable=False)
    reserve_price = Column(Float)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    current_highest_bid = Column(Float)
    current_highest_bidder_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(20), default='scheduled')  # scheduled, live, ended, cancelled
    min_bid_increment = Column(Float, default=10.0)
    auto_extension_enabled = Column(Boolean, default=True)

    product = relationship("Product", back_populates="auction")
    farmer = relationship("User", back_populates="auctions_as_farmer", foreign_keys=[farmer_id])
    agent = relationship("User", back_populates="auctions_as_agent", foreign_keys=[agent_id])
    current_highest_bidder = relationship("User", foreign_keys=[current_highest_bidder_id])
    bids = relationship("Bid", back_populates="auction", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="auction")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id", ondelete="CASCADE"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bid_amount = Column(Float, nullable=False)
    bid_time = Column(DateTime(timezone=True), server_default=func.now())
    is_winning = Column(Boolean, default=False)

    auction = relationship("Auction", back_populates="bids")
    bidder = relationship("User", back_populates="bids")