"""SQLAlchemy ORM model for the task management system."""

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, validates


class Base(DeclarativeBase):
    """Declarative base shared across all models."""
    pass


class Task(Base):
    """A single task (or subtask) in the Kanban board.

    Status lifecycle:
        standby → todo → doing → done

    The temporal trigger rule forces `status = "standby"` whenever
    `start_datetime` is in the future. Once the clock passes that
    threshold the task is promoted to `todo`.
    """

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, default=None)

    # ── Temporal fields ────────────────────────────────────────────────
    start_datetime: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=None, nullable=True
    )
    due_date: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True, default=None
    )

    # ── Status & priority ──────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20), default="todo", nullable=False
    )
    priority: Mapped[str] = mapped_column(
        String(20), default="normal", nullable=False
    )
    archived: Mapped[bool] = mapped_column(default=False, nullable=False)

    # ── Tags (stored as comma-separated text) ──────────────────────────
    tags: Mapped[Optional[str]] = mapped_column(String(500), default=None)

    # ── Hierarchy (self-referential for subtasks) ──────────────────────
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=True,
        default=None,
    )

    parent: Mapped[Optional["Task"]] = relationship(
        back_populates="children",
        remote_side="Task.id",
    )
    children: Mapped[list["Task"]] = relationship(
        back_populates="parent",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # ── Audit timestamps ───────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=None, nullable=True
    )

    @validates("status")
    def validate_status(self, key, value):
        # We use getattr/dict access to avoid recursion issues or uninitialized attr access
        current_status = getattr(self, "status", None)
        if value == "done" and current_status != "done":
            self.completed_at = datetime.now()
        elif value != "done" and current_status == "done":
            self.completed_at = None
        return value

    # ── Convenience helpers (used by routes / serialisation) ───────────

    def tag_list(self) -> list[str]:
        """Parse the comma-separated tags string into a list."""
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    @property
    def is_overdue(self) -> bool:
        """True when the task has a past due-date and isn't done."""
        if self.due_date is None or self.status == "done":
            return False
        return date.today() > self.due_date

    @property
    def subtasks_done(self) -> int:
        """Count of children with status == 'done'."""
        return sum(1 for c in self.children if c.status == "done")

    @property
    def subtasks_total(self) -> int:
        """Total number of direct children."""
        return len(self.children)

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>"
