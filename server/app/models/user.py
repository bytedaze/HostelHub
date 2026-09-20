"""User model used when storing users in MongoDB."""

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """The roles supported by the hostel system."""

    STUDENT = "student"
    ADMIN = "admin"


class User(BaseModel):
    """Shape of a user document stored in the users collection."""

    name: str
    email: str
    password_hash: str
    role: UserRole = UserRole.STUDENT
    phone: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
