"""FastAPI routes for user groups management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.group import UserGroup
from ..models.user import User
from ..schemas.group import GroupCreate, GroupResponse, GroupUpdate
from ..schemas.user import UserResponse

router = APIRouter(prefix="/user-groups", tags=["groups"])


@router.get("", response_model=list[GroupResponse])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List user groups owned by current user or containing current user."""
    groups = db.query(UserGroup).filter(UserGroup.owner_id == current_user.id).order_by(UserGroup.name.asc()).all()
    return [
        GroupResponse(
            id=g.id,
            name=g.name,
            owner_id=g.owner_id,
            created_at=g.created_at,
            members=[UserResponse.model_validate(m) for m in g.members],
        )
        for g in groups
    ]


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new user group."""
    members = db.query(User).filter(User.id.in_(payload.member_ids)).all() if payload.member_ids else []

    group = UserGroup(
        name=payload.name,
        owner_id=current_user.id,
        members=members,
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    return GroupResponse(
        id=group.id,
        name=group.name,
        owner_id=group.owner_id,
        created_at=group.created_at,
        members=[UserResponse.model_validate(m) for m in group.members],
    )


@router.patch("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: int,
    payload: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update group name or member list."""
    group = db.query(UserGroup).filter(UserGroup.id == group_id, UserGroup.owner_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado ou sem permissão.")

    if payload.name is not None:
        group.name = payload.name
    if payload.member_ids is not None:
        members = db.query(User).filter(User.id.in_(payload.member_ids)).all() if payload.member_ids else []
        group.members = members

    db.commit()
    db.refresh(group)

    return GroupResponse(
        id=group.id,
        name=group.name,
        owner_id=group.owner_id,
        created_at=group.created_at,
        members=[UserResponse.model_validate(m) for m in group.members],
    )


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a user group."""
    group = db.query(UserGroup).filter(UserGroup.id == group_id, UserGroup.owner_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado ou sem permissão.")

    db.delete(group)
    db.commit()
    return None
