"""Pydantic schemas for User Settings."""

from pydantic import BaseModel, ConfigDict


class UserSettingsResponse(BaseModel):
    id: int
    user_id: int
    auto_archive_minutes: int | None = None

    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    auto_archive_minutes: int | None = None
