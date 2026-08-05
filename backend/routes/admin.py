"""FastAPI routes for admin user management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_admin, hash_password
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """List all registered users (Admin only)."""
    users = db.query(User).order_by(User.username.asc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Create a new user (Admin only)."""
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nome de usuário '{payload.username}' já está em uso.",
        )

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        email=payload.email,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Update user fields (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

    if payload.username and payload.username != user.username:
        existing = db.query(User).filter(User.username == payload.username).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome de usuário já está em uso.")
        user.username = payload.username

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = payload.email
    if payload.role is not None:
        if admin.id == user_id and payload.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível remover suas próprias permissões de administrador.",
            )
        user.role = payload.role
    if payload.password and payload.password.strip():
        user.password_hash = hash_password(payload.password)

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Delete a user (Admin only). Cannot delete self."""
    if admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir a própria conta de administrador em uso.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

    db.delete(user)
    db.commit()
    return None
