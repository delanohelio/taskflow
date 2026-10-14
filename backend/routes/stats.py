"""FastAPI routes for user statistics and analytics."""

from datetime import datetime, timezone, timedelta
from typing import Dict
from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.task import Task
from ..models.task_share import TaskShare
from ..models.user import User
from ..schemas.stats import (
    DayActivity,
    PriorityDistribution,
    StatusDistribution,
    TagMetric,
    UserStatsResponse,
)

router = APIRouter(prefix="/stats", tags=["stats"])

WEEKDAY_NAMES_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


@router.get("", response_model=UserStatsResponse)
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Calculate user productivity metrics, on-time completion rates, priority/status distributions,
    7-day activity velocity trend, tag analytics, and overall productivity score."""
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
    today = now.date()

    total_tasks = sum(1 for t in tasks if t.parent_id is None)
    completed_tasks = 0
    completed_on_time = 0
    overdue_tasks = 0
    standby_tasks = 0

    subtasks_total = 0
    subtasks_completed = 0

    priority_dist = {"high": 0, "normal": 0, "low": 0}
    status_dist = {"todo": 0, "doing": 0, "done": 0, "standby": 0}
    tag_counts: Dict[str, int] = {}

    # Initialize last 7 days map
    last_7_days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
    activity_map = {
        d.isoformat(): {
            "date": d.isoformat(),
            "day_name": WEEKDAY_NAMES_PT[d.weekday()],
            "completed": 0,
            "created": 0,
        }
        for d in last_7_days
    }

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

        # Tags distribution
        if task.tags:
            for raw_tag in task.tags.split(","):
                t = raw_tag.strip()
                if t:
                    tag_counts[t] = tag_counts.get(t, 0) + 1

        # Created activity
        if task.created_at:
            created_d = task.created_at.date() if hasattr(task.created_at, "date") else None
            if created_d:
                iso_created = created_d.isoformat()
                if iso_created in activity_map:
                    activity_map[iso_created]["created"] += 1

        if task.status == "done":
            completed_tasks += 1
            comp_date = None
            if task.completed_at:
                comp_date = task.completed_at.date() if hasattr(task.completed_at, "date") else None
            elif task.updated_at:
                comp_date = task.updated_at.date() if hasattr(task.updated_at, "date") else None

            if comp_date:
                iso_comp = comp_date.isoformat()
                if iso_comp in activity_map:
                    activity_map[iso_comp]["completed"] += 1

            if task.due_date:
                ref_date = comp_date or today
                if ref_date <= task.due_date:
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

    # Calculate smart productivity score (0 - 100)
    if total_tasks == 0:
        productivity_score = 100
    else:
        penalty_overdue = min(100.0, (overdue_tasks / total_tasks * 100.0) * 1.5)
        raw_score = (0.5 * completion_rate) + (0.35 * on_time_rate) + (0.15 * max(0.0, 100.0 - penalty_overdue))
        productivity_score = max(5, min(100, int(round(raw_score))))

    # Sorted top tags
    top_tags = [
        TagMetric(tag=k, count=v)
        for k, v in sorted(tag_counts.items(), key=lambda item: item[1], reverse=True)[:8]
    ]

    recent_activity_trend = [
        DayActivity(**item) for item in activity_map.values()
    ]

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
        recent_activity_trend=recent_activity_trend,
        tag_distribution=top_tags,
        productivity_score=productivity_score,
    )
