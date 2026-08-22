from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, nullable=False)

    translations = relationship("CategoryTranslation", back_populates="category", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="category")

class CategoryTranslation(Base):
    __tablename__ = "category_translations"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)

    category = relationship("Category", back_populates="translations")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    price = Column(Float, nullable=False, default=0.0)
    rating = Column(Float, default=0.0)
    status = Column(String(30), default='pending_inspection')
    location = Column(String(255))
    pincode = Column(String(10))
    available_date = Column(Date)
    auction_type = Column(String(20), default="fixed")
    auction_start_time = Column(DateTime(timezone=True))
    auction_end_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farmer = relationship("User", back_populates="products")
    category = relationship("Category", back_populates="products")
    media = relationship("ProductMedia", back_populates="product", cascade="all, delete-orphan")
    inspection_report = relationship("InspectionReport", back_populates="product", uselist=False, cascade="all, delete-orphan")
    auction = relationship("Auction", back_populates="product", uselist=False)
    orders = relationship("Order", back_populates="product")

    @property
    def category_slug(self):
        return self.category.slug if self.category else None

class ProductMedia(Base):
    __tablename__ = "product_media"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    media_type = Column(String(20), nullable=False)
    url = Column(String(500), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="media")
    uploader = relationship("User", back_populates="media_uploads")

class InspectionReport(Base):
    __tablename__ = "inspection_reports"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inspection_date = Column(DateTime(timezone=True), server_default=func.now())
    quality_grade = Column(String(10))
    freshness_score = Column(Float)
    defect_rate = Column(Float)
    size_uniformity = Column(String(100))
    color_ripeness = Column(String(100))
    foreign_material = Column(String(255))
    moisture = Column(Float)
    weight_estimate = Column(Float)
    confidence_score = Column(Float)
    recommendations = Column(Text)
    final_base_price = Column(Float, nullable=False)
    notes = Column(Text)

    # ✅ New column to store category-specific inspection parameters as JSON
    inspection_data = Column(Text, nullable=True)

    product = relationship("Product", back_populates="inspection_report")
    agent = relationship("User", back_populates="inspections")