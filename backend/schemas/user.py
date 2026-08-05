"""Pydantic schemas for User management and Auth."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Body for creating a new user (Admin endpoint)."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    role: str = Field(default="user", pattern="^(admin|user)$")


class UserUpdate(BaseModel):
    """Body for updating an existing user (Admin endpoint)."""
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    password: Optional[str] = Field(default=None, min_length=4)
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[str] = None
    role: Optional[str] = Field(default=None, pattern="^(admin|user)$")


class ProfileUpdate(BaseModel):
    """Body for a user updating their own profile."""
    password: Optional[str] = Field(default=None, min_length=4)
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request payload."""
    username: str
    password: str


class UserResponse(BaseModel):
    """User response data."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None


class LoginResponse(BaseModel):
    """Login response with JWT token and user info."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
