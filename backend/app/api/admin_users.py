from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from ..database import get_db
from ..models.user import User
from ..core.deps import require_role

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])

@router.get("")
def list_users(
    search: str = Query("", description="Search by name, email, or phone"),
    role: str = Query("", description="Filter by role (farmer, trader, agent, admin)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """
    Admin endpoint to list all users with search, role filter, and pagination.
    """
    query = db.query(User)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(search_term),
                User.email.ilike(search_term),
                User.phone.ilike(search_term),
            )
        )

    if role:
        query = query.filter(User.role == role)

    total = query.count()
    users = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    def user_to_dict(user):
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "language": user.language,
            "location": user.location,
            "verified": user.verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": [user_to_dict(u) for u in users],
    }


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """
    Delete a user by ID. Admin only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deleting yourself? Optional, but good practice.
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    try:
        db.delete(user)
        db.commit()
        return {"message": f"User {user_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Could not delete user: {str(e)}"
        )