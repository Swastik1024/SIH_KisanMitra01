from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    gateway_transaction_id = Column(String(255))
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default='INR')
    status = Column(String(20), default='created')  # created, authorized, captured, failed, refunded
    payment_method = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="payments")

class EscrowAccount(Base):
    __tablename__ = "escrow_accounts"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    amount_held = Column(Float, nullable=False)
    status = Column(String(20), default='held')  # held, released, refunded
    released_at = Column(DateTime(timezone=True))
    released_to = Column(String(255))

    order = relationship("Order", back_populates="escrow")

class Payout(Base):
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default='pending')  # pending, processed, failed
    payout_reference = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="payouts")
    order = relationship("Order", back_populates="payouts")

class GSTInvoice(Base):
    __tablename__ = "gst_invoices"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    invoice_number = Column(String(100), nullable=False)
    gstin_seller = Column(String(50))
    gstin_buyer = Column(String(50))
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    igst = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    invoice_pdf_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="gst_invoice")

class Commission(Base):
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default='pending')  # pending, paid

    order = relationship("Order", back_populates="commissions")
    agent = relationship("User", back_populates="commissions")