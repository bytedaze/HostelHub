"""Pydantic schemas for rooms and room allocations."""

from datetime import datetime

from pydantic import BaseModel, Field


class RoomCreate(BaseModel):
    """Fields required when an administrator creates a room."""

    room_number: str
    room_type: str
    capacity: int = Field(gt=0)
    fee_per_month: float = Field(ge=0)


class RoomResponse(BaseModel):
    """Public room information returned by the API."""

    id: str
    room_number: str
    room_type: str
    capacity: int
    occupied_count: int
    fee_per_month: float
    status: str


class AllocateRoomRequest(BaseModel):
    """Room and student IDs used to create an active allocation."""

    student_id: str
    room_id: str


class RoomAllocationResponse(BaseModel):
    """Details returned after allocating a room."""

    id: str
    student_id: str
    room_id: str
    allocated_date: datetime
    status: str
    room: RoomResponse


class ActiveRoomAllocationResponse(BaseModel):
    """Allocation details shown to administrators."""

    id: str
    student_id: str
    student_name: str
    student_email: str
    room_id: str
    room_number: str
    room_type: str
    allocated_date: datetime
    status: str
