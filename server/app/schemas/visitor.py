"""Pydantic schemas for hostel visitor entries."""

from datetime import datetime

from pydantic import BaseModel


class VisitorCreate(BaseModel):
    """Fields a student provides when logging a visitor."""

    visitor_name: str
    visitor_phone: str
    purpose: str


class VisitorResponse(BaseModel):
    """Public visitor data, including the host student's details."""

    id: str
    student_id: str
    student_name: str
    student_email: str
    student_phone: str = ""
    visitor_name: str
    visitor_phone: str
    purpose: str
    check_in_time: datetime
    check_out_time: datetime | None
