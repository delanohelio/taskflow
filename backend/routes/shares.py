"""FastAPI routes for task sharing invitations and status management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.group import UserGroup
from ..models.task import Task
from ..models.task_share import TaskShare
from ..models.user import User
from ..schemas.share import ShareTaskRequest, TaskShareResponse
from ..schemas.user import UserResponse

router = APIRouter(prefix="", tags=["shares"])


@router.post("/tasks/{task_id}/share", response_model=list[TaskShareResponse])
def share_task(
    task_id: int,
    payload: ShareTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invite users or user groups to access a task. Only task owner can invite."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada.")

    # Only task owner can share
    if task.owner_id is not None and task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o proprietário da tarefa pode compartilhá-la.",
        )

    target_user_ids = set(payload.user_ids)

    # Expand groups to user IDs
    if payload.group_ids:
        groups = db.query(UserGroup).filter(UserGroup.id.in_(payload.group_ids)).all()
        for g in groups:
            for member in g.members:
                target_user_ids.add(member.id)

    # Remove owner from targets
    target_user_ids.discard(current_user.id)

    created_or_existing_shares = []
    for uid in target_user_ids:
        existing_share = (
            db.query(TaskShare)
            .filter(TaskShare.task_id == task_id, TaskShare.user_id == uid)
            .first()
        )
        if not existing_share:
            new_share = TaskShare(task_id=task_id, user_id=uid, status="pending")
            db.add(new_share)
            created_or_existing_shares.append(new_share)
        else:
            created_or_existing_shares.append(existing_share)

    db.commit()

    # Re-fetch shares to populate relationships
    result = (
        db.query(TaskShare)
        .filter(TaskShare.task_id == task_id, TaskShare.user_id.in_(target_user_ids))
        .all()
    )

    return [
        TaskShareResponse(
            id=s.id,
            task_id=s.task_id,
            user_id=s.user_id,
            status=s.status,
            created_at=s.created_at,
            user=UserResponse.model_validate(s.user),
        )
        for s in result
    ]


@router.get("/shares/invitations", response_model=list[TaskShareResponse])
def list_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pending task share invitations for the current user."""
    shares = (
        db.query(TaskShare)
        .filter(TaskShare.user_id == current_user.id, TaskShare.status == "pending")
        .order_by(TaskShare.created_at.desc())
        .all()
    )
    return [
        TaskShareResponse(
            id=s.id,
            task_id=s.task_id,
            user_id=s.user_id,
            status=s.status,
            created_at=s.created_at,
            user=UserResponse.model_validate(s.user),
        )
        for s in shares
    ]


@router.post("/shares/{share_id}/accept", response_model=TaskShareResponse)
def accept_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a task share invitation."""
    share = (
        db.query(TaskShare)
        .filter(TaskShare.id == share_id, TaskShare.user_id == current_user.id)
        .first()
    )
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Convite não encontrado.")

    share.status = "accepted"
    db.commit()
    db.refresh(share)

    return TaskShareResponse(
        id=share.id,
        task_id=share.task_id,
        user_id=share.user_id,
        status=share.status,
        created_at=share.created_at,
        user=UserResponse.model_validate(share.user),
    )


@router.post("/shares/{share_id}/reject", response_model=TaskShareResponse)
def reject_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a task share invitation."""
    share = (
        db.query(TaskShare)
        .filter(TaskShare.id == share_id, TaskShare.user_id == current_user.id)
        .first()
    )
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Convite não encontrado.")

    share.status = "rejected"
    db.commit()
    db.refresh(share)

    return TaskShareResponse(
        id=share.id,
        task_id=share.task_id,
        user_id=share.user_id,
        status=share.status,
        created_at=share.created_at,
        user=UserResponse.model_validate(share.user),
    )


@router.delete("/shares/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke or delete a task share.

    Can be called by the task owner (to remove a shared user) or by the recipient
    (to revoke their own access). Automatically removes subtask assignees for that user.
    """
    share = db.query(TaskShare).filter(TaskShare.id == share_id).first()
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compartilhamento não encontrado.")

    task = db.query(Task).filter(Task.id == share.task_id).first()

    # Check permission: must be task owner OR the shared user
    is_owner = task and task.owner_id == current_user.id
    is_recipient = share.user_id == current_user.id

    if not (is_owner or is_recipient):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para revogar este compartilhamento.",
        )

    user_id_to_remove = share.user_id
    task_id_to_clean = share.task_id

    # Remove subtask delegations for user_id_to_remove under task_id_to_clean
    if task:
        # Task subtasks (including the task itself if subtask)
        subtask_ids = [c.id for c in task.children]
        subtask_ids.append(task.id)

        subtasks = db.query(Task).filter(Task.id.in_(subtask_ids)).all()
        target_user = db.query(User).filter(User.id == user_id_to_remove).first()
        if target_user:
            for sub in subtasks:
                if target_user in sub.assignees:
                    sub.assignees.remove(target_user)

    db.delete(share)
    db.commit()
    return None
