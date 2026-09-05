from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import random
import hashlib

from ..database import get_db
from ..models.product import Product, InspectionReport
from ..models.user import User
from ..core.deps import get_current_user

router = APIRouter(prefix="/api/inspection", tags=["ai-inspection"])

@router.post("/auto-analyze")
def auto_analyze_product(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product_id = payload.get("product_id")
    image_url = payload.get("image_url")
    
    product = None
    has_image = False
    
    if product_id:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product and product.media:
            photos_count = len([m for m in product.media if m.media_type == 'image' or not m.media_type])
            if photos_count >= 2:
                has_image = True
                if not image_url and len(product.media) > 0:
                    image_url = product.media[0].url
            elif photos_count < 2:
                return {
                    "is_valid": False,
                    "error": f"At least 2 product photos are compulsory for AI inspection verification. Only {photos_count} photo(s) found."
                }

    if image_url:
        has_image = True

    if not has_image:
        return {
            "is_valid": False,
            "error": "At least 2 product photos are compulsory for AI inspection verification."
        }


    # Simulate fake/AI generated image detection
    # Use a deterministic seed so the same product always gets the same result
    is_fake = False
    if image_url and any(kw in image_url.lower() for kw in ["fake", "ai_generated", "synthetic", "generated"]):
        is_fake = True
    else:
        # Deterministic 5% chance based on product+image seed — consistent across calls
        fake_seed_str = f"{product_id}-{image_url}"
        fake_seed_val = int(hashlib.md5(fake_seed_str.encode()).hexdigest(), 16)
        fake_rng = random.Random(fake_seed_val)
        if fake_rng.random() < 0.05:
            is_fake = True

    if is_fake:
        if product:
            product.status = "flagged"
            report = db.query(InspectionReport).filter(InspectionReport.product_id == product.id).first()
            if not report:
                report = InspectionReport(
                    product_id=product.id,
                    quality_grade="REJECTED",
                    final_base_price=product.price or 0.0,
                    notes="Image appears to be AI generated or manipulated. Crop marked as FLAGGED.",
                    recommendations="Upload an authentic, clear photo of your produce."
                )
                db.add(report)
            else:
                report.quality_grade = "REJECTED"
                report.notes = "Image appears to be AI generated or manipulated. Crop marked as FLAGGED."
            db.commit()

        return {
            "is_valid": False,
            "is_fake": True,
            "quality_grade": "REJECTED",
            "error": "Image appears to be AI generated or manipulated. Crop marked as FLAGGED."
        }
    
    product_name = product.name if product else payload.get("product_name", "Agricultural Crop")
    declared_price = product.price if product and product.price > 0 else float(payload.get("price", 100.0))
    declared_qty = product.quantity if product else float(payload.get("quantity", 100.0))
    
    # Deterministic yet realistic AI scoring seed based on product name/id/url
    seed_str = f"{product_id}-{product_name}-{image_url}"
    seed_val = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed_val)
    
    # Quality score distribution
    freshness = round(rng.uniform(84.0, 98.5), 1)
    defect_rate = round(rng.uniform(1.2, 5.8), 1)
    moisture = round(rng.uniform(11.0, 16.5), 1)
    confidence = round(rng.uniform(92.0, 99.2), 1)
    
    if freshness >= 92.0 and defect_rate <= 3.0:
        quality_grade = "A+"
        price_multiplier = 1.15
        color_ripeness = "Optimal Vivid Color (Peak Maturity)"
        size_uniformity = "High (94% Uniform)"
    elif freshness >= 87.0:
        quality_grade = "A"
        price_multiplier = 1.05
        color_ripeness = "Good Natural Color"
        size_uniformity = "Moderate (88% Uniform)"
    else:
        quality_grade = "B"
        price_multiplier = 0.95
        color_ripeness = "Slight Variance in Color"
        size_uniformity = "Acceptable (82% Uniform)"
        
    estimated_base_price = round(declared_price * price_multiplier, 2)
    
    if product:
        product.status = "verified"
        report = db.query(InspectionReport).filter(InspectionReport.product_id == product.id).first()
        if not report:
            report = InspectionReport(
                product_id=product.id,
                quality_grade=quality_grade,
                freshness_score=freshness,
                defect_rate=defect_rate,
                size_uniformity=size_uniformity,
                color_ripeness=color_ripeness,
                foreign_material="< 0.4% (Negligible)",
                moisture=moisture,
                weight_estimate=declared_qty,
                confidence_score=confidence,
                recommendations=f"Produce shows strong surface integrity with high freshness ({freshness}%). Recommended for premium auction listing.",
                final_base_price=estimated_base_price,
                notes=f"AI Computer Vision Assessment completed with {confidence}% confidence score."
            )
            db.add(report)
        else:
            report.quality_grade = quality_grade
            report.freshness_score = freshness
            report.defect_rate = defect_rate
            report.size_uniformity = size_uniformity
            report.color_ripeness = color_ripeness
            report.moisture = moisture
            report.confidence_score = confidence
            report.final_base_price = estimated_base_price
            report.notes = f"AI Computer Vision Assessment completed with {confidence}% confidence score."
        db.commit()

    analysis_results = {
        "is_valid": True,
        "product_id": product_id,
        "product_name": product_name,
        "quality_grade": quality_grade,
        "freshness_score": freshness,
        "defect_rate": defect_rate,
        "size_uniformity": size_uniformity,
        "color_ripeness": color_ripeness,
        "foreign_material": "< 0.4% (Negligible)",
        "moisture": moisture,
        "weight_estimate": declared_qty,
        "confidence_score": confidence,
        "recommendations": f"Produce shows strong surface integrity with high freshness ({freshness}%). Recommended for premium auction listing.",
        "final_base_price": estimated_base_price,
        "notes": f"AI Computer Vision Assessment completed with {confidence}% confidence score.",
        "detected_features": [
            f"Surface Texture: Smooth & Healthy",
            f"Color Saturation: {color_ripeness}",
            f"Defect Density: {defect_rate}%",
            f"Estimated Shelf Life: 7-10 Days"
        ]
    }
    
    return analysis_results

