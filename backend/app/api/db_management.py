from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import text, func
import os
import time
from typing import Dict, Any, List

from ..database import get_db, engine, Base, SessionLocal
from ..config import settings
from ..models.user import User, TraderLicense, AgentProfile
from ..models.product import Category, CategoryTranslation, Product, InspectionReport
from ..models.auction import Auction, Bid
from ..models.order import Order
from ..models.settings import PlatformSetting
from ..core.security import hash_password
from ..core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/db", tags=["database-api"])

@router.get("/health")
def db_health_check(db: Session = Depends(get_db)):
    start_time = time.time()
    try:
        db.execute(text("SELECT 1"))
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "healthy",
            "database_url": settings.DATABASE_URL.split("///")[-1] if "sqlite" in settings.DATABASE_URL else "PostgreSQL Server",
            "latency_ms": latency_ms,
            "connected": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@router.get("/stats")
def get_db_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    try:
        stats = {}
        models = [
            ("users", User),
            ("categories", Category),
            ("products", Product),
            ("auctions", Auction),
            ("bids", Bid),
            ("orders", Order),
            ("inspection_reports", InspectionReport),
            ("trader_licenses", TraderLicense),
            ("agent_profiles", AgentProfile),
            ("platform_settings", PlatformSetting)
        ]
        
        table_counts = {}
        for name, model in models:
            table_counts[name] = db.query(func.count(model.id)).scalar() or 0
            
        db_path = "kisanmitra.db"
        if "sqlite" in settings.DATABASE_URL:
            db_path = settings.DATABASE_URL.replace("sqlite:///", "")
            
        size_bytes = os.path.getsize(db_path) if os.path.exists(db_path) else 0
        size_mb = round(size_bytes / (1024 * 1024), 2)
        
        return {
            "database_type": "SQLite" if "sqlite" in settings.DATABASE_URL else "Relational DB",
            "db_path": db_path,
            "db_size_mb": size_mb,
            "total_tables": len(models),
            "table_row_counts": table_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading DB stats: {str(e)}")

@router.post("/seed")
def seed_database(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    try:
        # Create database tables if missing
        Base.metadata.create_all(bind=engine)
        
        # 1. Seed Categories & Translations
        category_data = [
            {"slug": "vegetables", "en": "Vegetables", "hi": "सब्जियां", "mr": "भाज्या"},
            {"slug": "fruits", "en": "Fruits", "hi": "फल", "mr": "फळे"},
            {"slug": "grains", "en": "Grains & Cereals", "hi": "अनाज", "mr": "धान्य"},
            {"slug": "pulses", "en": "Pulses & Dal", "hi": "दालें", "mr": "डाळी"},
            {"slug": "herbs", "en": "Spices & Herbs", "hi": "मसाले और जड़ी-बूटियां", "mr": "मसाले आणि वनस्पती"}
        ]
        
        created_categories = 0
        for item in category_data:
            cat = db.query(Category).filter(Category.slug == item["slug"]).first()
            if not cat:
                cat = Category(slug=item["slug"])
                db.add(cat)
                db.flush()
                
                # Add translations
                t_en = CategoryTranslation(category_id=cat.id, language="en", name=item["en"])
                t_hi = CategoryTranslation(category_id=cat.id, language="hi", name=item["hi"])
                t_mr = CategoryTranslation(category_id=cat.id, language="mr", name=item["mr"])
                db.add_all([t_en, t_hi, t_mr])
                created_categories += 1
                
        # 2. Seed Default Admin User
        admin_user = db.query(User).filter(User.email == "admin.khetikart@gmail.com").first()
        if not admin_user:
            admin_user = User(
                name="System Admin",
                email="admin.khetikart@gmail.com",
                phone="7620404109",
                password_hash=hash_password("Swap@1234"),
                role="admin",
                verified=True
            )
            db.add(admin_user)
            
        # 3. Seed Default Platform Settings
        setting_defaults = [
            ("commission_rate", "5.0"),
            ("min_bid_increment", "10.0"),
            ("auto_extension_minutes", "5")
        ]
        for key, val in setting_defaults:
            st = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
            if not st:
                db.add(PlatformSetting(key=key, value=val))

        db.commit()
        return {
            "message": "Database successfully initialized and seeded with essential defaults!",
            "categories_created": created_categories,
            "admin_account": "admin.khetikart@gmail.com"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database seed failed: {str(e)}")
