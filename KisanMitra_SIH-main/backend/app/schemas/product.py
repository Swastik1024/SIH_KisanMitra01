from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class CategoryOut(BaseModel):
    id: int
    slug: str

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    category_id: int
    description: Optional[str] = None
    quantity: float
    unit: str  # kg, quintal, ton, etc.
    price: float
    location: Optional[str] = None
    pincode: Optional[str] = None
    available_date: Optional[date] = None
    auction_type: Optional[str] = "fixed"
    auction_start_time: Optional[datetime] = None
    auction_end_time: Optional[datetime] = None

class MediaUpload(BaseModel):
    media_type: str  # 'image' or 'video'
    url: str

class InspectionReportCreate(BaseModel):
    product_id: int
    quality_grade: str
    freshness_score: Optional[float] = None
    defect_rate: Optional[float] = None
    size_uniformity: Optional[str] = None
    color_ripeness: Optional[str] = None
    foreign_material: Optional[str] = None
    moisture: Optional[float] = None
    weight_estimate: Optional[float] = None
    confidence_score: Optional[float] = None
    recommendations: Optional[str] = None
    final_base_price: float
    notes: Optional[str] = None

class InspectionReportOut(BaseModel):
    id: int
    product_id: int
    agent_id: int
    inspection_date: datetime
    quality_grade: str
    freshness_score: Optional[float]
    defect_rate: Optional[float]
    size_uniformity: Optional[str]
    color_ripeness: Optional[str]
    foreign_material: Optional[str]
    moisture: Optional[float]
    weight_estimate: Optional[float]
    confidence_score: Optional[float]
    recommendations: Optional[str]
    final_base_price: float
    notes: Optional[str]

    class Config:
        from_attributes = True

class ProductOut(BaseModel):
    id: int
    farmer_id: int
    category_id: int
    name: str
    description: Optional[str]
    quantity: float
    unit: str
    price: float
    rating: float
    status: str
    location: Optional[str]
    pincode: Optional[str] = None
    available_date: Optional[date] = None
    auction_type: Optional[str] = "fixed"
    auction_start_time: Optional[datetime] = None
    auction_end_time: Optional[datetime] = None
    created_at: datetime
    media: List[MediaUpload] = []
    inspection_report: Optional[InspectionReportOut] = None

    class Config:
        from_attributes = True

class ProductPublicOut(BaseModel):
    id: int
    farmer_id: int
    category_id: int
    name: str
    description: Optional[str]
    quantity: float
    unit: str
    price: float
    rating: float
    status: str
    location: Optional[str]
    pincode: Optional[str] = None
    available_date: Optional[date] = None
    auction_type: Optional[str] = "fixed"
    auction_start_time: Optional[datetime] = None
    auction_end_time: Optional[datetime] = None
    category_slug: str
    media: List[MediaUpload] = []

    class Config:
        from_attributes = True