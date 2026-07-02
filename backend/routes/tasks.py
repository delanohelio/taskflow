"""Task CRUD routes with temporal trigger enforcement.

Business rules:
  • If `start_datetime` is in the future → status is forced to `standby`.
  • When the clock passes `start_datetime` → task is promoted to `todo`.
  • The `/trigger-temporal` endpoint bulk-promotes all eligible standby tasks.
"""

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.task import Task
from ..schemas.task import (
    DailyReviewResponse,
    StatusUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


# ── Helpers ────────────────────────────────────────────────────────────────


def _apply_temporal_trigger(task: Task) -> None:
    """Enforce the stand-by rule on a single task.

    • Future `start_datetime` → force standby.
    • Past/null `start_datetime` and status is still standby → promote to todo.
    """
    if task.status == "done":
        return  # never demote a completed task

    now = datetime.now()

    if task.start_datetime and task.start_datetime > now:
        task.status = "standby"
    elif task.status == "standby":
        # start_datetime is in the past (or null) → promote
        task.status = "todo"


def _task_to_response(task: Task) -> TaskResponse:
    """Convert an ORM Task to a TaskResponse, populating computed fields."""
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        start_datetime=task.start_datetime,
        due_date=task.due_date,
        status=task.status,
        priority=task.priority,
        tags=task.tags,
        parent_id=task.parent_id,
        archived=task.archived,
        created_at=task.created_at,
        updated_at=task.updated_at,
        tag_list=task.tag_list(),
        is_overdue=task.is_overdue,
        subtasks_done=task.subtasks_done,
        subtasks_total=task.subtasks_total,
        children=[_task_to_response(c) for c in task.children],
    )


# ── GET /tasks — list all tasks (with optional filters) ───────────────────


@router.get("/board", response_model=dict)
def get_board(db: Session = Depends(get_db)):
    """Return tasks grouped by Kanban column status.

    Only top-level tasks (parent_id is NULL) are returned.
    Standby tasks with a past start_datetime are auto-promoted first.
    """
    # Auto-promote any standby tasks whose time has come
    standby_tasks = (
        db.query(Task)
        .filter(Task.status == "standby", Task.parent_id.is_(None), Task.archived.is_(False))
        .all()
    )
    for task in standby_tasks:
        _apply_temporal_trigger(task)
    db.commit()

    # Fetch top-level tasks for each column
    top_level = (
        db.query(Task)
        .filter(Task.parent_id.is_(None), Task.archived.is_(False))
        .order_by(Task.created_at.desc())
        .all()
    )

    columns: dict[str, list[TaskResponse]] = {
        "todo": [],
        "doing": [],
        "done": [],
        "standby": [],
    }
    overdue: list[TaskResponse] = []

    for task in top_level:
        response = _task_to_response(task)
        if task.status in columns:
            columns[task.status].append(response)
        if task.is_overdue:
            overdue.append(response)

    return {
        "todo": [t.model_dump() for t in columns["todo"]],
        "doing": [t.model_dump() for t in columns["doing"]],
        "done": [t.model_dump() for t in columns["done"]],
        "standby": [t.model_dump() for t in columns["standby"]],
        "overdue": [t.model_dump() for t in overdue],
    }


@router.get("/review", response_model=DailyReviewResponse)
def get_daily_review(db: Session = Depends(get_db)):
    """Return a summary for the daily review banner."""
    today = date.today()

    today_tasks = (
        db.query(Task)
        .filter(
            Task.due_date == today,
            Task.status != "done",
            Task.parent_id.is_(None),
            Task.archived.is_(False),
        )
        .all()
    )

    overdue_tasks = (
        db.query(Task)
        .filter(
            Task.due_date < today,
            Task.status != "done",
            Task.parent_id.is_(None),
            Task.archived.is_(False),
        )
        .all()
    )

    return DailyReviewResponse(
        today_count=len(today_tasks),
        overdue_count=len(overdue_tasks),
        today_tasks=[_task_to_response(t) for t in today_tasks],
        overdue_tasks=[_task_to_response(t) for t in overdue_tasks],
    )


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    status: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    parent_id: Optional[int] = Query(None),
    archived: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
):
    """List tasks with optional filters."""
    query = db.query(Task)

    if status is not None:
        query = query.filter(Task.status == status)
    if tag is not None:
        query = query.filter(Task.tags.contains(tag))
    if parent_id is not None:
        query = query.filter(Task.parent_id == parent_id)
    else:
        # Default: only top-level tasks
        query = query.filter(Task.parent_id.is_(None))

    if archived is not None:
        query = query.filter(Task.archived == archived)

    tasks = query.order_by(Task.created_at.desc()).all()
    return [_task_to_response(t) for t in tasks]


# ── POST /tasks — create a new task ───────────────────────────────────────


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(body: TaskCreate, db: Session = Depends(get_db)):
    """Create a task. Temporal trigger is enforced automatically."""
    # Validate parent exists
    if body.parent_id is not None:
        parent = db.get(Task, body.parent_id)
        if not parent:
            raise HTTPException(404, "Parent task does not exist.")

    # Convert tags list to comma-separated string for storage
    tags_csv = ",".join(body.tags) if body.tags else None

    new_task = Task(
        title=body.title,
        description=body.description,
        start_datetime=body.start_datetime,
        due_date=body.due_date,
        status="todo",  # provisional — overridden by temporal trigger
        priority=body.priority,
        tags=tags_csv,
        parent_id=body.parent_id,
        archived=body.archived if body.archived is not None else False,
    )

    _apply_temporal_trigger(new_task)

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return _task_to_response(new_task)


# ── GET /tasks/{id} — single task with children ──────────────────────────


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a single task by ID, including its subtasks."""
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found.")
    return _task_to_response(task)


# ── PATCH /tasks/{id} — partial update ────────────────────────────────────


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, body: TaskUpdate, db: Session = Depends(get_db)):
    """Update specific fields of a task."""
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found.")

    update_data = body.model_dump(exclude_unset=True)

    # Handle tags: convert list → CSV
    if "tags" in update_data:
        tags_value = update_data.pop("tags")
        task.tags = ",".join(tags_value) if tags_value else None

    for field, value in update_data.items():
        setattr(task, field, value)

    # Re-evaluate temporal trigger after field changes
    _apply_temporal_trigger(task)

    db.commit()
    db.refresh(task)
    return _task_to_response(task)


# ── PATCH /tasks/{id}/status — column move (drag & drop) ─────────────────


@router.patch("/{task_id}/status", response_model=TaskResponse)
def move_task_status(
    task_id: int,
    body: StatusUpdate,
    db: Session = Depends(get_db),
):
    """Move a task to a new Kanban column.

    Standby tasks cannot be directly moved — the temporal trigger
    controls when they appear on the board.
    """
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found.")

    if task.status == "standby":
        raise HTTPException(
            400,
            "Cannot move a standby task. It will be promoted automatically "
            "when its start_datetime arrives.",
        )

    task.status = body.status
    db.commit()
    db.refresh(task)
    return _task_to_response(task)


# ── DELETE /tasks/{id} ────────────────────────────────────────────────────


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task and all its subtasks (cascade)."""
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found.")

    db.delete(task)
    db.commit()
    return {"deleted": task_id}


# ── POST /tasks/trigger-temporal — bulk promote standby tasks ─────────────


@router.post("/trigger-temporal")
def trigger_temporal(db: Session = Depends(get_db)):
    """Re-evaluate temporal triggers for all standby tasks.

    Called periodically by the frontend (polling) or manually by an admin.
    Returns the count of tasks that were promoted from standby → todo.
    """
    now = datetime.now()
    standby_tasks = db.query(Task).filter(Task.status == "standby", Task.archived.is_(False)).all()

    promoted_count = 0
    for task in standby_tasks:
        if not task.start_datetime or task.start_datetime <= now:
            task.status = "todo"
            promoted_count += 1

    db.commit()
    return {"promoted": promoted_count, "checked": len(standby_tasks)}
