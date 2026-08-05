"""SQLAlchemy ORM models for User Groups."""

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .task import Base

if TYPE_CHECKING:
    from .user import User

user_group_members = Table(
    "user_group_members",
    Base.metadata,
    Column("group_id", Integer, ForeignKey("user_groups.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class UserGroup(Base):
    """Group of users for easy activity sharing."""

    __tablename__ = "user_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id], lazy="selectin")
    members: Mapped[list["User"]] = relationship(
        "User",
        secondary=user_group_members,
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<UserGroup(id={self.id}, name='{self.name}', owner_id={self.owner_id})>"
