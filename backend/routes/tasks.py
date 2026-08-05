"""Task CRUD routes with temporal trigger enforcement, multi-user isolation, and task sharing.

Business rules:
  • If `start_datetime` is in the future → status is forced to `standby`.
  • When the clock passes `start_datetime` → task is promoted to `todo`.
  • The `/trigger-temporal` endpoint bulk-promotes all eligible standby tasks.
  • Tasks belong to an owner. Shared tasks are accessible to users with status='accepted'.
  • Subtasks can be assigned to task owner or accepted shared users.
"""

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models.task import Task
from ..models.task_share import TaskShare
from ..models.user import User
from ..schemas.share import SubtaskAssigneeRequest, TaskShareResponse
from ..schemas.task import (
    DailyReviewResponse,
    StatusUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from ..schemas.user import UserResponse

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


def _has_access(task: Task, user: User) -> bool:
    """Check if a user has access to a task (as owner or accepted shared user)."""
    if task.owner_id == user.id:
        return True
    if task.owner_id is None:  # Legacy unowned task
        return True
    # Check share
    for s in task.shares:
        if s.user_id == user.id and s.status == "accepted":
            return True
    return False


def _task_to_response(task: Task, current_user: Optional[User] = None) -> TaskResponse:
    """Convert an ORM Task to a TaskResponse, populating computed fields."""
    owner_res = UserResponse.model_validate(task.owner) if task.owner else None
    shares_res = [
        TaskShareResponse(
            id=s.id,
            task_id=s.task_id,
            user_id=s.user_id,
            status=s.status,
            created_at=s.created_at,
            user=UserResponse.model_validate(s.user),
        )
        for s in task.shares
    ]
    assignees_res = [UserResponse.model_validate(u) for u in task.assignees]

    is_shared = len([s for s in task.shares if s.status == "accepted"]) > 0
    is_shared_with_me = False
    if current_user and task.owner_id and task.owner_id != current_user.id:
        is_shared_with_me = True

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
        owner_id=task.owner_id,
        archived=task.archived,
        created_at=task.created_at,
        updated_at=task.updated_at,
        owner=owner_res,
        shares=shares_res,
        assignees=assignees_res,
        tag_list=task.tag_list(),
        is_overdue=task.is_overdue,
        is_shared=is_shared,
        is_shared_with_me=is_shared_with_me,
        subtasks_done=task.subtasks_done,
        subtasks_total=task.subtasks_total,
        children=[_task_to_response(c, current_user) for c in task.children],
    )


def _get_user_accessible_tasks_query(db: Session, current_user: User):
    """Query builder to get tasks accessible by current user (owner or accepted share)."""
    accepted_shared_task_ids = (
        db.query(TaskShare.task_id)
        .filter(TaskShare.user_id == current_user.id, TaskShare.status == "accepted")
        .scalar_subquery()
    )

    return db.query(Task).filter(
        or_(
            Task.owner_id == current_user.id,
            Task.owner_id.is_(None),
            Task.id.in_(accepted_shared_task_ids),
        )
    )



# ── GET /tasks/board — grouped by status ──────────────────────────────────


@router.get("/board", response_model=dict)
def get_board(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return tasks accessible to current_user, grouped by Kanban column status."""
    # Auto-promote any standby tasks whose time has come
    query = _get_user_accessible_tasks_query(db, current_user)
    standby_tasks = (
        query.filter(Task.status == "standby", Task.parent_id.is_(None), Task.archived.is_(False))
        .all()
    )
    for task in standby_tasks:
        _apply_temporal_trigger(task)
    db.commit()

    # Fetch top-level tasks for each column
    top_level = (
        query.filter(Task.parent_id.is_(None), Task.archived.is_(False))
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
        response = _task_to_response(task, current_user)
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
def get_daily_review(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a summary for the daily review banner for current user."""
    today = date.today()
    query = _get_user_accessible_tasks_query(db, current_user)

    today_tasks = (
        query.filter(
            Task.due_date == today,
            Task.status != "done",
            Task.parent_id.is_(None),
            Task.archived.is_(False),
        )
        .all()
    )

    overdue_tasks = (
        query.filter(
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
        today_tasks=[_task_to_response(t, current_user) for t in today_tasks],
        overdue_tasks=[_task_to_response(t, current_user) for t in overdue_tasks],
    )


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    status: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    parent_id: Optional[int] = Query(None),
    archived: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List tasks accessible by current user with optional filters."""
    query = _get_user_accessible_tasks_query(db, current_user)

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
    return [_task_to_response(t, current_user) for t in tasks]


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(
    body: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a task owned by current_user. Temporal trigger is enforced automatically."""
    # Validate parent exists and user has access
    if body.parent_id is not None:
        parent = db.get(Task, body.parent_id)
        if not parent or not _has_access(parent, current_user):
            raise HTTPException(404, "Tarefa pai não encontrada ou sem permissão.")

    tags_csv = ",".join(body.tags) if body.tags else None

    new_task = Task(
        title=body.title,
        description=body.description,
        start_datetime=body.start_datetime,
        due_date=body.due_date,
        status="todo",
        priority=body.priority,
        tags=tags_csv,
        parent_id=body.parent_id,
        owner_id=current_user.id,
        archived=body.archived if body.archived is not None else False,
    )

    _apply_temporal_trigger(new_task)

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return _task_to_response(new_task, current_user)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single task by ID if accessible by current_user."""
    task = db.get(Task, task_id)
    if not task or not _has_access(task, current_user):
        raise HTTPException(404, "Tarefa não encontrada.")
    return _task_to_response(task, current_user)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    body: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update specific fields of a task (accessible to owner and accepted shared users)."""
    task = db.get(Task, task_id)
    if not task or not _has_access(task, current_user):
        raise HTTPException(404, "Tarefa não encontrada.")

    update_data = body.model_dump(exclude_unset=True)

    if "tags" in update_data:
        tags_value = update_data.pop("tags")
        task.tags = ",".join(tags_value) if tags_value else None

    for field, value in update_data.items():
        setattr(task, field, value)

    _apply_temporal_trigger(task)

    db.commit()
    db.refresh(task)
    return _task_to_response(task, current_user)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def move_task_status(
    task_id: int,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Move a task to a new Kanban column."""
    task = db.get(Task, task_id)
    if not task or not _has_access(task, current_user):
        raise HTTPException(404, "Tarefa não encontrada.")

    if task.status == "standby":
        raise HTTPException(
            400,
            "Não é possível mover uma tarefa em standby diretamente. "
            "Ela será promovida automaticamente quando o horário de início for atingido.",
        )

    task.status = body.status
    db.commit()
    db.refresh(task)
    return _task_to_response(task, current_user)


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a task and all its subtasks. Only owner can delete."""
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Tarefa não encontrada.")

    if task.owner_id is not None and task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o proprietário da tarefa pode excluí-la.",
        )

    db.delete(task)
    db.commit()
    return {"deleted": task_id}


@router.post("/{task_id}/assignees", response_model=TaskResponse)
def set_subtask_assignees(
    task_id: int,
    body: SubtaskAssigneeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set assigned users for a subtask.

    Allowed assignees are restricted to the task owner and users who accepted sharing for the parent task.
    """
    subtask = db.get(Task, task_id)
    if not subtask:
        raise HTTPException(404, "Subtarefa não encontrada.")

    # Find root task to check permissions
    root_task = subtask
    while root_task.parent:
        root_task = root_task.parent

    if not _has_access(root_task, current_user):
        raise HTTPException(403, "Sem permissão para alterar esta subtarefa.")

    # Valid assignees = owner + users who accepted share
    valid_user_ids = set()
    if root_task.owner_id:
        valid_user_ids.add(root_task.owner_id)
    for s in root_task.shares:
        if s.status == "accepted":
            valid_user_ids.add(s.user_id)

    # Filter requested user IDs
    allowed_assignee_ids = [uid for uid in body.user_ids if uid in valid_user_ids]
    assignee_users = db.query(User).filter(User.id.in_(allowed_assignee_ids)).all() if allowed_assignee_ids else []

    subtask.assignees = assignee_users
    db.commit()
    db.refresh(subtask)

    return _task_to_response(subtask, current_user)


@router.post("/trigger-temporal")
def trigger_temporal(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-evaluate temporal triggers for all standby tasks."""
    now = datetime.now()
    query = _get_user_accessible_tasks_query(db, current_user)
    standby_tasks = query.filter(Task.status == "standby", Task.archived.is_(False)).all()

    promoted_count = 0
    for task in standby_tasks:
        if not task.start_datetime or task.start_datetime <= now:
            task.status = "todo"
            promoted_count += 1

    db.commit()
    return {"promoted": promoted_count, "checked": len(standby_tasks)}
