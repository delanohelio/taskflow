"""Pydantic request / response schemas for the task API."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Request schemas ──────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    """Body for POST /tasks."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    due_date: Optional[date] = None
    priority: str = Field(default="normal", pattern="^(low|normal|high)$")
    tags: list[str] = Field(default_factory=list)
    parent_id: Optional[int] = None
    archived: Optional[bool] = False


class TaskUpdate(BaseModel):
    """Body for PATCH /tasks/{id}.  Every field is optional."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    due_date: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern="^(standby|todo|doing|done)$")
    priority: Optional[str] = Field(default=None, pattern="^(low|normal|high)$")
    tags: Optional[list[str]] = None
    archived: Optional[bool] = None


class StatusUpdate(BaseModel):
    """Body for PATCH /tasks/{id}/status (drag-and-drop moves)."""

    status: str = Field(..., pattern="^(todo|doing|done)$")


# ── Response schemas ─────────────────────────────────────────────────────

class TaskResponse(BaseModel):
    """Single task returned by the API, including computed fields."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    due_date: Optional[date] = None
    status: str
    priority: str
    tags: Optional[str] = None
    parent_id: Optional[int] = None
    archived: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Computed fields (populated in the route, not by from_attributes)
    tag_list: list[str] = Field(default_factory=list)
    is_overdue: bool = False
    subtasks_done: int = 0
    subtasks_total: int = 0
    children: list["TaskResponse"] = Field(default_factory=list)


class DailyReviewResponse(BaseModel):
    """Summary for the daily review banner."""

    today_count: int = 0
    overdue_count: int = 0
    overdue_tasks: list[TaskResponse] = Field(default_factory=list)
    today_tasks: list[TaskResponse] = Field(default_factory=list)
