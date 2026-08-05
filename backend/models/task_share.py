"""SQLAlchemy ORM models for Task Sharing and Subtask Assignees."""

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .task import Base

if TYPE_CHECKING:
    from .task import Task
    from .user import User

subtask_assignees = Table(
    "subtask_assignees",
    Base.metadata,
    Column("subtask_id", Integer, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class TaskShare(Base):
    """Represents a sharing invitation / relation of a task with a user.

    Status:
        pending → accepted | rejected
    """

    __tablename__ = "task_shares"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, accepted, rejected

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], lazy="selectin")
    task: Mapped["Task"] = relationship("Task", foreign_keys=[task_id], back_populates="shares")

    def __repr__(self) -> str:
        return f"<TaskShare(id={self.id}, task_id={self.task_id}, user_id={self.user_id}, status='{self.status}')>"
