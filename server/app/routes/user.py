"""User lookup endpoints for administration features."""

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from app.database import db
from app.utils.security import get_current_admin

router = APIRouter(prefix="/users", tags=["Users"])
users_collection = db["users"]


class StudentSummary(BaseModel):
    """Public student fields used when assigning rooms."""

    id: str
    name: str
    email: EmailStr


@router.get("/students", response_model=list[StudentSummary])
async def list_students(
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> list[StudentSummary]:
    """Return all students for administrator room allocation forms."""

    del current_admin
    students = users_collection.find(
        {"role": "student"}, {"name": 1, "email": 1}
    ).sort("name", 1)

    return [
        StudentSummary(id=str(student["_id"]), name=student["name"], email=student["email"])
        async for student in students
    ]
