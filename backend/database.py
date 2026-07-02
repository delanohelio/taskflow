"""Database engine and session factory for the task management system."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models.task import Base

# ── Database location ────────────────────────────────────────────────────
# Default: tasks.db alongside this file.  Override with DB_PATH env var.
_db_dir = Path(__file__).resolve().parent
_db_path = os.environ.get("DB_PATH", str(_db_dir / "tasks.db"))
DB_URL = f"sqlite:///{_db_path}"

engine = create_engine(
    DB_URL,
    echo=False,
    connect_args={"check_same_thread": False},  # required for SQLite + threads
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables on import (idempotent)
Base.metadata.create_all(bind=engine)

# Add migration to ensure 'archived' column exists
from sqlalchemy import text
with engine.begin() as conn:
    try:
        conn.execute(text("SELECT archived FROM tasks LIMIT 1"))
    except Exception:
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN archived BOOLEAN DEFAULT 0 NOT NULL"))
            print("Successfully migrated tasks table to include 'archived' column.")
        except Exception as e:
            print(f"Migration error: {e}")


def get_db():
    """FastAPI dependency: yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
