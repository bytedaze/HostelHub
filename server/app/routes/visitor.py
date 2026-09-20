"""Visitor logging and administration endpoints."""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.database import db
from app.schemas.visitor import VisitorCreate, VisitorResponse
from app.utils.security import get_current_admin, get_current_user

router = APIRouter(prefix="/visitors", tags=["Visitors"])
visitors_collection = db["visitors"]
users_collection = db["users"]


def object_id_or_400(value: str, label: str) -> ObjectId:
    """Convert a request ID to ObjectId and provide a friendly client error."""

    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return ObjectId(value)


def to_visitor_response(
    visitor_document: dict[str, Any], student: dict[str, Any]
) -> VisitorResponse:
    """Combine a visitor and student document into the public response."""

    return VisitorResponse(
        id=str(visitor_document["_id"]),
        student_id=visitor_document["student_id"],
        student_name=student["name"],
        student_email=student["email"],
        visitor_name=visitor_document["visitor_name"],
        visitor_phone=visitor_document["visitor_phone"],
        purpose=visitor_document["purpose"],
        check_in_time=visitor_document["check_in_time"],
        check_out_time=visitor_document.get("check_out_time"),
    )


async def get_visitor_with_student(
    visitor_document: dict[str, Any],
) -> VisitorResponse | None:
    """Look up the host student and return an enriched visitor response."""

    if not ObjectId.is_valid(visitor_document["student_id"]):
        return None
    student = await users_collection.find_one(
        {"_id": ObjectId(visitor_document["student_id"]), "role": "student"}
    )
    if not student:
        return None
    return to_visitor_response(visitor_document, student)


@router.post("", response_model=VisitorResponse, status_code=status.HTTP_201_CREATED)
async def create_visitor(
    visitor_data: VisitorCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> VisitorResponse:
    """Log a visitor for the authenticated student."""

    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can log visitors")

    visitor_document = {
        "student_id": str(current_user["_id"]),
        "visitor_name": visitor_data.visitor_name,
        "visitor_phone": visitor_data.visitor_phone,
        "purpose": visitor_data.purpose,
        "check_in_time": datetime.now(timezone.utc),
        "check_out_time": None,
    }
    insert_result = await visitors_collection.insert_one(visitor_document)
    visitor_document["_id"] = insert_result.inserted_id
    return to_visitor_response(visitor_document, current_user)


@router.get("", response_model=list[VisitorResponse])
async def list_visitors(
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> list[VisitorResponse]:
    """List all visitor entries, newest check-ins first."""

    del current_admin
    visitors: list[VisitorResponse] = []
    visitor_documents = visitors_collection.find().sort("check_in_time", -1)
    async for visitor_document in visitor_documents:
        visitor = await get_visitor_with_student(visitor_document)
        if visitor:
            visitors.append(visitor)
    return visitors


@router.get("/my-visitors", response_model=list[VisitorResponse])
async def list_my_visitors(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[VisitorResponse]:
    """Return visitor entries belonging to the authenticated student."""

    visitor_documents = visitors_collection.find(
        {"student_id": str(current_user["_id"])}
    ).sort("check_in_time", -1)
    return [
        to_visitor_response(visitor_document, current_user)
        async for visitor_document in visitor_documents
    ]


@router.put("/{visitor_id}/checkout", response_model=VisitorResponse)
async def checkout_visitor(
    visitor_id: str,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> VisitorResponse:
    """Record the current time as a visitor's check-out time."""

    del current_admin
    visitor_document = await visitors_collection.find_one_and_update(
        {"_id": object_id_or_400(visitor_id, "visitor ID")},
        {"$set": {"check_out_time": datetime.now(timezone.utc)}},
        return_document=ReturnDocument.AFTER,
    )
    if not visitor_document:
        raise HTTPException(status_code=404, detail="Visitor entry not found")

    visitor = await get_visitor_with_student(visitor_document)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor student not found")
    return visitor


@router.delete("/{visitor_id}")
async def delete_visitor(
    visitor_id: str,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> dict[str, str]:
    """Delete a visitor entry."""

    del current_admin
    delete_result = await visitors_collection.delete_one(
        {"_id": object_id_or_400(visitor_id, "visitor ID")}
    )
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visitor entry not found")
    return {"message": "Visitor entry deleted successfully"}
