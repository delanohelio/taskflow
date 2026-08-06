"""FastAPI routes for user discovery (available to any authenticated user)."""

from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def search_users(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List or search registered users for sharing tasks and user groups (available to any logged-in user)."""
    query = db.query(User)
    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            (User.username.ilike(search_term))
            | (User.full_name.ilike(search_term))
            | (User.email.ilike(search_term))
        )
    users = query.order_by(User.username.asc()).all()
    return [UserResponse.model_validate(u) for u in users]
