"""FastAPI routes for authentication and user profile management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from ..database import get_db
from ..models.user import User
from ..schemas.user import LoginRequest, LoginResponse, ProfileUpdate, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with username and password, returning JWT access token."""
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos.",
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role, "id": user.id})
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current logged-in user profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile of currently logged-in user (password, full_name, email)."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.email is not None:
        current_user.email = payload.email
    if payload.password is not None and payload.password.strip():
        current_user.password_hash = hash_password(payload.password)

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
