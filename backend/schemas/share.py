"""Pydantic schemas for Task Sharing and Subtask Assignees."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from .user import UserResponse


class ShareTaskRequest(BaseModel):
    """Payload to share a task with users and/or user groups."""
    user_ids: list[int] = Field(default_factory=list)
    group_ids: list[int] = Field(default_factory=list)


class SubtaskAssigneeRequest(BaseModel):
    """Payload to set assignees for a subtask."""
    user_ids: list[int] = Field(default_factory=list)


class TaskShareResponse(BaseModel):
    """Response model for a task share invitation."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    user_id: int
    status: str  # pending, accepted, rejected
    created_at: Optional[datetime] = None
    user: UserResponse
