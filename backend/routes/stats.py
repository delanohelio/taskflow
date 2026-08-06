"""FastAPI routes for user statistics and analytics."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.task import Task
from ..models.task_share import TaskShare
from ..models.user import User
from ..schemas.stats import (
    PriorityDistribution,
    StatusDistribution,
    UserStatsResponse,
)

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=UserStatsResponse)
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Calculate user productivity metrics, on-time completion rates, and priority/status distributions."""
    accepted_shared_ids = (
        db.query(TaskShare.task_id)
        .filter(TaskShare.user_id == current_user.id, TaskShare.status == "accepted")
        .scalar_subquery()
    )

    tasks = (
        db.query(Task)
        .filter(
            or_(
                Task.owner_id == current_user.id,
                Task.owner_id.is_(None),
                Task.id.in_(accepted_shared_ids),
            )
        )
        .all()
    )

    now = datetime.now(timezone.utc)

    total_tasks = sum(1 for t in tasks if t.parent_id is None)
    completed_tasks = 0
    completed_on_time = 0
    overdue_tasks = 0
    standby_tasks = 0

    subtasks_total = 0
    subtasks_completed = 0

    priority_dist = {"high": 0, "normal": 0, "low": 0}
    status_dist = {"todo": 0, "doing": 0, "done": 0, "standby": 0}

    today = datetime.now(timezone.utc).date()

    for task in tasks:
        # Ignore subtasks in top-level task counts
        if task.parent_id is not None:
            continue

        # Status distribution
        st = task.status if task.status in status_dist else "todo"
        status_dist[st] += 1

        # Priority distribution
        pr = task.priority if task.priority in priority_dist else "normal"
        priority_dist[pr] += 1

        if task.status == "done":
            completed_tasks += 1
            if task.due_date:
                comp_date = task.completed_at.date() if task.completed_at else today
                if comp_date <= task.due_date:
                    completed_on_time += 1
            else:
                completed_on_time += 1
        elif task.status == "standby":
            standby_tasks += 1
        else:
            if task.due_date and task.due_date < today:
                overdue_tasks += 1

        # Subtasks
        subtasks = task.children or []
        subtasks_total += len(subtasks)
        subtasks_completed += sum(1 for s in subtasks if s.status == "done")


    completion_rate = (completed_tasks / total_tasks * 100.0) if total_tasks > 0 else 0.0
    on_time_rate = (completed_on_time / completed_tasks * 100.0) if completed_tasks > 0 else 0.0

    return UserStatsResponse(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completed_on_time=completed_on_time,
        overdue_tasks=overdue_tasks,
        standby_tasks=standby_tasks,
        subtasks_total=subtasks_total,
        subtasks_completed=subtasks_completed,
        completion_rate_percent=round(completion_rate, 1),
        on_time_rate_percent=round(on_time_rate, 1),
        by_priority=PriorityDistribution(**priority_dist),
        by_status=StatusDistribution(**status_dist),
    )
