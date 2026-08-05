"""Pydantic schemas for User Groups."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from .user import UserResponse


class GroupCreate(BaseModel):
    """Body for creating a user group."""
    name: str = Field(..., min_length=1, max_length=100)
    member_ids: list[int] = Field(default_factory=list)


class GroupUpdate(BaseModel):
    """Body for updating a user group."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    member_ids: Optional[list[int]] = None


class GroupResponse(BaseModel):
    """Response model for a user group."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    owner_id: int
    created_at: Optional[datetime] = None
    members: list[UserResponse] = Field(default_factory=list)
