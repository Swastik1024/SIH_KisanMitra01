from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.product import Product, InspectionReport
from ..models.auction import Auction
from ..models.user import User
from ..schemas.product import InspectionReportCreate, InspectionReportOut, ProductOut
from ..schemas.auction import AuctionCreate, AuctionOut
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/agent", tags=["agent"])

@router.get("/pending", response_model=List[ProductOut])
def get_pending_inspections(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent"))
):
    products = db.query(Product).filter(Product.status == "pending_inspection").all()
    return products

@router.post("/inspect", response_model=InspectionReportOut)
def inspect_product(
    data: InspectionReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent"))
):
    # Check if agent is approved
    if not current_user.agent_profile or not current_user.agent_profile.is_approved:
        raise HTTPException(status_code=403, detail="Agent not approved")
    
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product is pending inspection
    if product.status != "pending_inspection":
        raise HTTPException(status_code=400, detail="Product already inspected or not eligible")
    
    # Create inspection report
    report = InspectionReport(
        product_id=product.id,
        agent_id=current_user.id,
        quality_grade=data.quality_grade,
        freshness_score=data.freshness_score,
        defect_rate=data.defect_rate,
        size_uniformity=data.size_uniformity,
        color_ripeness=data.color_ripeness,
        foreign_material=data.foreign_material,
        moisture=data.moisture,
        weight_estimate=data.weight_estimate,
        confidence_score=data.confidence_score,
        recommendations=data.recommendations,
        final_base_price=data.final_base_price,
        notes=data.notes
    )
    db.add(report)
    # Update product status to 'verified'
    product.status = "verified"
    db.commit()
    db.refresh(report)
    return report

@router.post("/auction", response_model=AuctionOut)
def create_auction(
    data: AuctionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("agent"))
):
    # Ensure agent is approved
    if not current_user.agent_profile or not current_user.agent_profile.is_approved:
        raise HTTPException(status_code=403, detail="Agent not approved")
    
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Only verified products can be auctioned
    if product.status != "verified":
        raise HTTPException(status_code=400, detail="Product not verified for auction")
    
    # Ensure product doesn't already have an auction
    existing_auction = db.query(Auction).filter(Auction.product_id == product.id).first()
    if existing_auction:
        raise HTTPException(status_code=400, detail="Auction already exists for this product")
    
    # Fetch inspection report to get base price
    inspection = db.query(InspectionReport).filter(InspectionReport.product_id == product.id).first()
    if not inspection:
        raise HTTPException(status_code=400, detail="No inspection report found")
    
    auction = Auction(
        product_id=product.id,
        farmer_id=product.farmer_id,
        agent_id=current_user.id,
        base_price=inspection.final_base_price,
        reserve_price=data.reserve_price,
        start_time=data.start_time,
        end_time=data.end_time,
        status="scheduled",
        min_bid_increment=data.min_bid_increment,
        auto_extension_enabled=data.auto_extension_enabled
    )
    db.add(auction)
    # Update product status to 'listed'
    product.status = "listed"
    db.commit()
    db.refresh(auction)
    return auction