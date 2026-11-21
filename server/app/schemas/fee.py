"""Pydantic schemas for hostel fee records."""

from datetime import datetime

from pydantic import BaseModel, Field


class FeeCreate(BaseModel):
    """Fields required when an administrator creates a fee record."""

    student_id: str
    amount: float = Field(gt=0)
    due_date: datetime


class FeeResponse(BaseModel):
    """Public fee information returned by the API."""

    id: str
    student_id: str
    student_name: str
    student_email: str
    student_phone: str = ""
    amount: float
    due_date: datetime
    paid_status: str
    payment_date: datetime | None
    receipt_no: str | None
