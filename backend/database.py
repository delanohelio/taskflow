"""Database engine and session factory for the task management system."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base, User, Task, UserGroup, TaskShare

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

# Add migration to ensure 'completed_at' column exists
with engine.begin() as conn:
    try:
        conn.execute(text("SELECT completed_at FROM tasks LIMIT 1"))
    except Exception:
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN completed_at DATETIME DEFAULT NULL"))
            print("Successfully migrated tasks table to include 'completed_at' column.")
        except Exception as e:
            print(f"Migration error (completed_at): {e}")

# Add migration to ensure 'owner_id' column exists in tasks
with engine.begin() as conn:
    try:
        conn.execute(text("SELECT owner_id FROM tasks LIMIT 1"))
    except Exception:
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN owner_id INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL"))
            print("Successfully migrated tasks table to include 'owner_id' column.")
        except Exception as e:
            print(f"Migration error (owner_id): {e}")


def init_default_admin():
    """Ensure default admin user exists on startup and has role='admin'."""
    from .auth import hash_password
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            default_password = os.environ.get("DEFAULT_ADMIN_PASSWORD", "admin123")
            admin_user = User(
                username="admin",
                password_hash=hash_password(default_password),
                full_name="Administrador",
                email="admin@taskflow.local",
                role="admin",
            )
            db.add(admin_user)
            db.commit()
            print(f"Default admin user created successfully (username: 'admin').")
        elif admin.role != "admin":
            admin.role = "admin"
            db.commit()
            print("Ensured admin user has role='admin'.")
    except Exception as e:
        print(f"Error seeding default admin user: {e}")
    finally:
        db.close()




def get_db():
    """FastAPI dependency: yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

