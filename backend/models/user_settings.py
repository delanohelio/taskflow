"""ORM model for per-user settings."""

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .task import Base


class UserSettings(Base):
    """User-specific settings and preferences."""

    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    auto_archive_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)

    user = relationship("User", back_populates="settings")
