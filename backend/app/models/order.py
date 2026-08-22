from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, CheckConstraint, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=True)
    trader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(20), default='pending')  # pending, accepted, shipped, delivered, cancelled
    payment_status = Column(String(20), default='pending')  # pending, held, released, refunded, collected
    delivery_charge = Column(Float, default=0.0)

    # ✅ New delivery and payment fields
    delivery_address = Column(Text, nullable=True)
    delivery_city = Column(String(100), nullable=True)
    delivery_state = Column(String(100), nullable=True)
    delivery_pincode = Column(String(10), nullable=True)
    delivery_phone = Column(String(20), nullable=True)
    payment_method = Column(String(50), nullable=True)

    # ✅ Platform fee and transaction fields
    platform_fee = Column(Float, default=0.0)
    payment_transaction_id = Column(String(255), nullable=True)
    delivery_commission = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="orders")
    auction = relationship("Auction", back_populates="orders")
    trader = relationship("User", back_populates="orders_as_trader", foreign_keys=[trader_id])
    agent = relationship("User", back_populates="orders_as_agent", foreign_keys=[agent_id])
    delivery_tracking = relationship("OrderDeliveryTracking", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("PaymentTransaction", back_populates="order")
    escrow = relationship("EscrowAccount", back_populates="order", uselist=False)
    payouts = relationship("Payout", back_populates="order")
    commissions = relationship("Commission", back_populates="order")
    gst_invoice = relationship("GSTInvoice", back_populates="order", uselist=False)
    rating = relationship("OrderRating", back_populates="order", uselist=False)

class OrderDeliveryTracking(Base):
    __tablename__ = "order_delivery_tracking"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)  # packed, shipped, in_transit, out_for_delivery, delivered
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    location = Column(String(255))
    note = Column(Text)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    proof_image_url = Column(String(500))

    order = relationship("Order", back_populates="delivery_tracking")
    updater = relationship("User", back_populates="delivery_updates")

class OrderRating(Base):
    __tablename__ = "order_ratings"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    rater_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ratee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Float, nullable=False)
    review = Column(Text)

    order = relationship("Order", back_populates="rating")