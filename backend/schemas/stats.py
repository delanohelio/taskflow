"""Pydantic schemas for User Statistics."""

from pydantic import BaseModel


class PriorityDistribution(BaseModel):
    high: int = 0
    normal: int = 0
    low: int = 0


class StatusDistribution(BaseModel):
    todo: int = 0
    doing: int = 0
    done: int = 0
    standby: int = 0


class UserStatsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    completed_on_time: int
    overdue_tasks: int
    standby_tasks: int
    subtasks_total: int
    subtasks_completed: int
    completion_rate_percent: float
    on_time_rate_percent: float
    by_priority: PriorityDistribution
    by_status: StatusDistribution
