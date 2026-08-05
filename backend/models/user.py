"""SQLAlchemy ORM model for User."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from .task import Base


class User(Base):
    """User model for authentication and access control."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(250), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default=None)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)  # "admin" or "user"

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
