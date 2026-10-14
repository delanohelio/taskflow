"""FastAPI application entry point for TaskFlow."""

import asyncio
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from .database import engine, Base, get_db  # noqa: F401 — ensures tables are created
from .auth import get_current_user
from .models.user import User as UserModel
from .routes.tasks import router as tasks_router



from pydantic import BaseModel

class PasswordVerify(BaseModel):
    password: str

class SettingsUpdate(BaseModel):
    auto_archive_minutes: Optional[int] = None


# ── Settings helpers ─────────────────────────────────────────────────────

SETTINGS_PATH = Path(os.environ.get("DB_PATH", "/app/data/tasks.db")).parent / "settings.json"

def _load_settings() -> dict:
    if SETTINGS_PATH.exists():
        try:
            return json.loads(SETTINGS_PATH.read_text())
        except Exception:
            pass
    # Fall back to env var
    env_val = os.environ.get("AUTO_ARCHIVE_AFTER_MINUTES")
    if env_val:
        try:
            return {"auto_archive_minutes": int(env_val)}
        except ValueError:
            pass
    return {"auto_archive_minutes": None}

def _save_settings(data: dict) -> None:
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_PATH.write_text(json.dumps(data))


# ── Lifecycle ────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks.

    On startup we launch a background task that periodically re-evaluates
    temporal triggers (promoting standby → todo tasks).
    """
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    from .database import init_default_admin
    init_default_admin()

    # Background temporal trigger (every 60 seconds)
    task = asyncio.create_task(_temporal_trigger_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


async def _temporal_trigger_loop():
    """Periodically promote standby tasks whose start_datetime has passed."""
    from .database import SessionLocal
    from .models.task import Task
    from datetime import datetime, timedelta

    while True:
        await asyncio.sleep(60)
        db = SessionLocal()
        try:
            now = datetime.now()
            # 1. Promote standby tasks
            standby_tasks = db.query(Task).filter(Task.status == "standby", Task.archived.is_(False)).all()
            for task in standby_tasks:
                if not task.start_datetime or task.start_datetime <= now:
                    task.status = "todo"

            # 2. Auto-archive done tasks (settings file takes priority over env var)
            settings = _load_settings()
            auto_archive_minutes = settings.get("auto_archive_minutes")
            if auto_archive_minutes is None:
                # Fall back to env var
                env_val = os.environ.get("AUTO_ARCHIVE_AFTER_MINUTES")
                if env_val:
                    try:
                        auto_archive_minutes = int(env_val)
                    except ValueError:
                        pass

            if auto_archive_minutes and auto_archive_minutes > 0:
                threshold_time = now - timedelta(minutes=auto_archive_minutes)
                overdue_done_tasks = (
                    db.query(Task)
                    .filter(
                        Task.status == "done",
                        Task.archived.is_(False),
                        Task.completed_at.isnot(None),
                        Task.completed_at <= threshold_time,
                    )
                    .all()
                )
                for task in overdue_done_tasks:
                    task.archived = True

            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


# ── App instance ─────────────────────────────────────────────────────────

app = FastAPI(
    title="TaskFlow API",
    description="Kanban board com gatilhos temporais e analytics — FastAPI + SQLite",
    version="3.0.0",
    lifespan=lifespan,
)


# ── CORS ─────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ───────────────────────────────────────────────────────────────

@app.get("/api/auth/config")
async def get_auth_config():
    require_password = bool(os.environ.get("PAGE_PASSWORD"))
    return {"require_password": require_password}

@app.post("/api/auth/verify")
async def verify_page_password(payload: PasswordVerify):
    page_password = os.environ.get("PAGE_PASSWORD")
    if not page_password:
        return {"valid": True}
    return {"valid": payload.password == page_password}


@app.get("/api/settings")
async def get_settings():
    """Return current app settings."""
    return _load_settings()


@app.patch("/api/settings")
async def update_settings(payload: SettingsUpdate):
    """Persist app settings to disk."""
    current = _load_settings()
    if payload.auto_archive_minutes is not None:
        current["auto_archive_minutes"] = payload.auto_archive_minutes
    elif "auto_archive_minutes" in payload.model_fields_set:
        current["auto_archive_minutes"] = None
    _save_settings(current)
    return current


@app.post("/api/tasks/archive-done")
async def archive_all_done():
    """Archive every done (completed) task immediately."""
    from .database import SessionLocal
    from .models.task import Task as TaskModel

    db = SessionLocal()
    try:
        done_tasks = (
            db.query(TaskModel)
            .filter(TaskModel.status == "done", TaskModel.archived.is_(False))
            .all()
        )
        count = len(done_tasks)
        for t in done_tasks:
            t.archived = True
        db.commit()
        return {"archived": count}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.get("/api/backup/export")
async def export_backup(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export tasks and personal settings for the authenticated user as a JSON object."""
    from datetime import datetime
    from .models.task import Task as TaskModel

    tasks = (
        db.query(TaskModel)
        .filter(TaskModel.owner_id == current_user.id)
        .order_by(TaskModel.id.asc())
        .all()
    )

    tasks_data = []
    for t in tasks:
        tasks_data.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "start_datetime": t.start_datetime.isoformat() if t.start_datetime else None,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "status": t.status,
            "priority": t.priority,
            "archived": t.archived,
            "tags": t.tags,
            "parent_id": t.parent_id,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        })

    return {
        "version": "1.0",
        "exported_at": datetime.now().isoformat(),
        "user_id": current_user.id,
        "username": current_user.username,
        "settings": {
            "auto_archive_minutes": current_user.auto_archive_minutes,
        },
        "tasks": tasks_data,
    }


@app.post("/api/backup/import")
async def import_backup(
    request: Request,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Import tasks and settings for the authenticated user from a JSON backup payload."""
    from datetime import datetime, date
    from .models.task import Task as TaskModel
    from .models.task_share import TaskShare as TaskShareModel

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Payload de JSON inválido.")

    if isinstance(body, dict):
        tasks_list = body.get("tasks", [])
        settings_data = body.get("settings")
    elif isinstance(body, list):
        tasks_list = body
        settings_data = None
    else:
        raise HTTPException(status_code=400, detail="Formato de backup não suportado.")

    try:
        # 1. Find existing tasks owned by current user
        user_tasks = db.query(TaskModel).filter(TaskModel.owner_id == current_user.id).all()
        user_task_ids = [t.id for t in user_tasks]

        # 2. Safely remove user's task shares and tasks without touching other users
        if user_task_ids:
            db.query(TaskShareModel).filter(TaskShareModel.task_id.in_(user_task_ids)).delete(synchronize_session=False)
            db.query(TaskModel).filter(TaskModel.owner_id == current_user.id).delete(synchronize_session=False)
            db.commit()

        id_map = {}  # old_id -> new Task object

        # 3. Pass 1: create all imported tasks assigned to current_user
        for item in tasks_list:
            old_id = item.get("id")
            start_dt = datetime.fromisoformat(item["start_datetime"]) if item.get("start_datetime") else None
            due_d = date.fromisoformat(item["due_date"]) if item.get("due_date") else None
            created_at = datetime.fromisoformat(item["created_at"]) if item.get("created_at") else datetime.now()
            updated_at = datetime.fromisoformat(item["updated_at"]) if item.get("updated_at") else datetime.now()
            completed_at = datetime.fromisoformat(item["completed_at"]) if item.get("completed_at") else None

            task = TaskModel(
                owner_id=current_user.id,
                title=item.get("title", "Sem título"),
                description=item.get("description"),
                start_datetime=start_dt,
                due_date=due_d,
                status=item.get("status", "todo"),
                priority=item.get("priority", "normal"),
                archived=bool(item.get("archived", False)),
                tags=item.get("tags"),
                parent_id=None,
                created_at=created_at,
                updated_at=updated_at,
                completed_at=completed_at,
            )
            db.add(task)
            db.flush()  # assign new id
            if old_id is not None:
                id_map[old_id] = task

        # 4. Pass 2: map parent_id references
        for item in tasks_list:
            old_id = item.get("id")
            old_parent_id = item.get("parent_id")
            if old_id in id_map and old_parent_id in id_map:
                id_map[old_id].parent_id = id_map[old_parent_id].id

        # 5. Update user personal settings if included
        if settings_data and isinstance(settings_data, dict):
            if "auto_archive_minutes" in settings_data:
                val = settings_data["auto_archive_minutes"]
                current_user.auto_archive_minutes = int(val) if val is not None and str(val).isdigit() else None
                db.add(current_user)

        db.commit()
        return {"status": "ok", "imported_count": len(tasks_list)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao importar backup: {str(e)}")




from .routes.auth import router as auth_router
from .routes.admin import router as admin_router
from .routes.groups import router as groups_router
from .routes.shares import router as shares_router
from .routes.tasks import router as tasks_router
from .routes.users import router as users_router
from .routes.stats import router as stats_router
from .routes.notifications import router as notifications_router

app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(groups_router, prefix="/api")
app.include_router(shares_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")




# ── Health check ─────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "taskflow"}

