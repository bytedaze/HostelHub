"""Complaint submission and administration endpoints."""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.database import db
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintStatusUpdate,
)
from app.utils.security import get_current_admin, get_current_user

router = APIRouter(prefix="/complaints", tags=["Complaints"])
complaints_collection = db["complaints"]
users_collection = db["users"]


def object_id_or_400(value: str, label: str) -> ObjectId:
    """Convert a request ID to ObjectId and provide a friendly client error."""

    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return ObjectId(value)


def to_complaint_response(
    complaint_document: dict[str, Any], student: dict[str, Any]
) -> ComplaintResponse:
    """Combine a complaint and student document into the public response."""

    return ComplaintResponse(
        id=str(complaint_document["_id"]),
        student_id=complaint_document["student_id"],
        student_name=student["name"],
        student_email=student["email"],
        student_phone=student.get("phone") or "",
        category=complaint_document["category"],
        description=complaint_document["description"],
        status=complaint_document["status"],
        created_at=complaint_document["created_at"],
        resolved_at=complaint_document.get("resolved_at"),
    )


async def get_complaint_with_student(
    complaint_document: dict[str, Any],
) -> ComplaintResponse | None:
    """Look up the complaint's student and return an enriched response."""

    if not ObjectId.is_valid(complaint_document["student_id"]):
        return None
    student = await users_collection.find_one(
        {"_id": ObjectId(complaint_document["student_id"]), "role": "student"}
    )
    if not student:
        return None
    return to_complaint_response(complaint_document, student)


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_data: ComplaintCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ComplaintResponse:
    """Create a pending complaint for the authenticated student."""

    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can create complaints")

    complaint_document = {
        "student_id": str(current_user["_id"]),
        "category": complaint_data.category,
        "description": complaint_data.description,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "resolved_at": None,
    }
    insert_result = await complaints_collection.insert_one(complaint_document)
    complaint_document["_id"] = insert_result.inserted_id
    return to_complaint_response(complaint_document, current_user)


@router.get("", response_model=list[ComplaintResponse])
async def list_complaints(
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> list[ComplaintResponse]:
    """List all complaints, newest first, for administrators."""

    del current_admin
    complaints: list[ComplaintResponse] = []
    complaint_documents = complaints_collection.find().sort("created_at", -1)
    async for complaint_document in complaint_documents:
        complaint = await get_complaint_with_student(complaint_document)
        if complaint:
            complaints.append(complaint)
    return complaints


@router.get("/my-complaints", response_model=list[ComplaintResponse])
async def list_my_complaints(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[ComplaintResponse]:
    """Return complaints belonging to the authenticated student."""

    complaint_documents = complaints_collection.find(
        {"student_id": str(current_user["_id"])}
    ).sort("created_at", -1)
    return [
        to_complaint_response(complaint_document, current_user)
        async for complaint_document in complaint_documents
    ]


@router.put("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: str,
    status_data: ComplaintStatusUpdate,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> ComplaintResponse:
    """Update a complaint status and record when it is resolved."""

    del current_admin
    if status_data.status not in {"pending", "in-progress", "resolved"}:
        raise HTTPException(status_code=400, detail="Invalid complaint status")

    resolved_at = datetime.now(timezone.utc) if status_data.status == "resolved" else None
    complaint_document = await complaints_collection.find_one_and_update(
        {"_id": object_id_or_400(complaint_id, "complaint ID")},
        {"$set": {"status": status_data.status, "resolved_at": resolved_at}},
        return_document=ReturnDocument.AFTER,
    )
    if not complaint_document:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint = await get_complaint_with_student(complaint_document)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint student not found")
    return complaint


@router.delete("/{complaint_id}")
async def delete_complaint(
    complaint_id: str,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> dict[str, str]:
    """Delete a complaint record."""

    del current_admin
    delete_result = await complaints_collection.delete_one(
        {"_id": object_id_or_400(complaint_id, "complaint ID")}
    )
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"message": "Complaint deleted successfully"}
