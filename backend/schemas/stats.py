"""Pydantic schemas for User Statistics."""

from typing import List
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


class DayActivity(BaseModel):
    date: str
    day_name: str
    completed: int = 0
    created: int = 0


class TagMetric(BaseModel):
    tag: str
    count: int = 0


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
    recent_activity_trend: List[DayActivity] = []
    tag_distribution: List[TagMetric] = []
    productivity_score: int = 0
