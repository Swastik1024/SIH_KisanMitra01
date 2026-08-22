from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.product import Category
from ..schemas.product import CategoryOut
from ..core.deps import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("/", response_model=List[CategoryOut])
def get_categories(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Category).all()