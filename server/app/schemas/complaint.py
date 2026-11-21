"""Pydantic schemas for hostel complaints."""

from datetime import datetime

from pydantic import BaseModel


class ComplaintCreate(BaseModel):
    """Fields a student provides when submitting a complaint."""

    category: str
    description: str


class ComplaintResponse(BaseModel):
    """Public complaint data, including the submitting student's details."""

    id: str
    student_id: str
    student_name: str
    student_email: str
    student_phone: str = ""
    category: str
    description: str
    status: str
    created_at: datetime
    resolved_at: datetime | None


class ComplaintStatusUpdate(BaseModel):
    """Status value selected by an administrator."""

    status: str
