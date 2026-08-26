from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.product import Category, CategoryTranslation
from ..schemas.product import CategoryOut

router = APIRouter(prefix="/api/categories", tags=["categories"])

DEFAULT_CATEGORIES = [
    {"slug": "vegetables", "en": "Vegetables", "hi": "सब्जियां"},
    {"slug": "fruits", "en": "Fruits", "hi": "फल"},
    {"slug": "grains", "en": "Grains", "hi": "अनाज"},
    {"slug": "pulses", "en": "Pulses", "hi": "दालें"},
    {"slug": "herbs", "en": "Herbs & Spices", "hi": "जड़ी-बूटियाँ और मसाले"},
    {"slug": "medical", "en": "Farm Medicine & Seeds", "hi": "कृषि दवाएं और बीज"},
    {"slug": "instruments", "en": "Machinery & Instruments", "hi": "कृषि यंत्र और उपकरण"},
]

def seed_categories_if_empty(db: Session):
    if db.query(Category).count() == 0:
        for item in DEFAULT_CATEGORIES:
            cat = Category(slug=item["slug"])
            db.add(cat)
            db.commit()
            db.refresh(cat)
            trans_en = CategoryTranslation(category_id=cat.id, language="en", name=item["en"])
            trans_hi = CategoryTranslation(category_id=cat.id, language="hi", name=item["hi"])
            db.add_all([trans_en, trans_hi])
        db.commit()

@router.get("/", response_model=List[CategoryOut])
def get_categories(
    db: Session = Depends(get_db)
):
    seed_categories_if_empty(db)
    return db.query(Category).all()