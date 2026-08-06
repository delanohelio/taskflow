"""FastAPI routes for user notifications."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.notification import Notification
from ..models.user import User
from ..schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all notifications for the currently logged-in user (newest first)."""
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a specific notification as read."""
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notificação não encontrada."
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return NotificationResponse.model_validate(notification)


@router.post("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications of current user as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read.is_(False)
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}
