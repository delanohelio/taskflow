"""FastAPI application entry point for TaskFlow."""

import asyncio
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base  # noqa: F401 — ensures tables are created
from .routes.tasks import router as tasks_router


from pydantic import BaseModel

class PasswordVerify(BaseModel):
    password: str



# ── Lifecycle ────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks.

    On startup we launch a background task that periodically re-evaluates
    temporal triggers (promoting standby → todo tasks).
    """
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

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
    from datetime import datetime

    while True:
        await asyncio.sleep(60)
        db = SessionLocal()
        try:
            now = datetime.now()
            standby_tasks = db.query(Task).filter(Task.status == "standby", Task.archived.is_(False)).all()
            for task in standby_tasks:
                if not task.start_datetime or task.start_datetime <= now:
                    task.status = "todo"
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


# ── App instance ─────────────────────────────────────────────────────────

app = FastAPI(
    title="TaskFlow API",
    description="Kanban board com gatilhos temporais — FastAPI + SQLite",
    version="1.0.0",
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

app.include_router(tasks_router, prefix="/api")


# ── Health check ─────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "taskflow"}
