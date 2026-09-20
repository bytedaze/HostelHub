"""Fee creation, payment, and lookup endpoints."""

import random
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.database import db
from app.schemas.fee import FeeCreate, FeeResponse
from app.utils.security import get_current_admin, get_current_user

router = APIRouter(prefix="/fees", tags=["Fees"])
fees_collection = db["fees"]
users_collection = db["users"]


def object_id_or_400(value: str, label: str) -> ObjectId:
    """Convert a request ID to ObjectId and provide a friendly client error."""

    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return ObjectId(value)


async def get_student(student_id: str) -> dict[str, Any]:
    """Find a student by ID, raising the shared validation error when absent."""

    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=404, detail="Student not found")

    student = await users_collection.find_one(
        {"_id": ObjectId(student_id), "role": "student"}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


def to_fee_response(
    fee_document: dict[str, Any], student: dict[str, Any]
) -> FeeResponse:
    """Combine a fee document and student document into the public response."""

    return FeeResponse(
        id=str(fee_document["_id"]),
        student_id=fee_document["student_id"],
        student_name=student["name"],
        student_email=student["email"],
        amount=fee_document["amount"],
        due_date=fee_document["due_date"],
        paid_status=fee_document["paid_status"],
        payment_date=fee_document.get("payment_date"),
        receipt_no=fee_document.get("receipt_no"),
    )


async def fee_with_student(fee_document: dict[str, Any]) -> FeeResponse:
    """Look up the fee's student and return an enriched response."""

    student = await get_student(fee_document["student_id"])
    return to_fee_response(fee_document, student)


@router.post("", response_model=FeeResponse, status_code=status.HTTP_201_CREATED)
async def create_fee(
    fee_data: FeeCreate,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> FeeResponse:
    """Create a pending fee record for an existing student."""

    del current_admin
    student = await get_student(fee_data.student_id)
    fee_document = {
        **fee_data.model_dump(),
        "paid_status": "pending",
        "payment_date": None,
        "receipt_no": None,
    }
    insert_result = await fees_collection.insert_one(fee_document)
    fee_document["_id"] = insert_result.inserted_id
    return to_fee_response(fee_document, student)


@router.get("", response_model=list[FeeResponse])
async def list_fees(
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> list[FeeResponse]:
    """List all fee records with their student details."""

    del current_admin
    fees: list[FeeResponse] = []
    async for fee_document in fees_collection.find().sort("due_date", 1):
        student = await users_collection.find_one(
            {"_id": ObjectId(fee_document["student_id"]), "role": "student"}
        ) if ObjectId.is_valid(fee_document["student_id"]) else None
        if student:
            fees.append(to_fee_response(fee_document, student))
    return fees


@router.get("/my-fees", response_model=list[FeeResponse])
async def list_my_fees(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[FeeResponse]:
    """Return fee records belonging to the currently logged-in student."""

    student_id = str(current_user["_id"])
    return [
        to_fee_response(fee_document, current_user)
        async for fee_document in fees_collection.find({"student_id": student_id}).sort(
            "due_date", 1
        )
    ]


@router.put("/{fee_id}/pay", response_model=FeeResponse)
async def pay_fee(
    fee_id: str,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> FeeResponse:
    """Mark a fee as paid and generate a receipt number."""

    del current_admin
    receipt_number = f"RCPT-{random.randint(100000, 999999)}"
    fee_document = await fees_collection.find_one_and_update(
        {"_id": object_id_or_400(fee_id, "fee ID")},
        {
            "$set": {
                "paid_status": "paid",
                "payment_date": datetime.now(timezone.utc),
                "receipt_no": receipt_number,
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if not fee_document:
        raise HTTPException(status_code=404, detail="Fee record not found")
    return await fee_with_student(fee_document)


@router.delete("/{fee_id}")
async def delete_fee(
    fee_id: str,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> dict[str, str]:
    """Delete a fee record."""

    del current_admin
    delete_result = await fees_collection.delete_one(
        {"_id": object_id_or_400(fee_id, "fee ID")}
    )
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fee record not found")
    return {"message": "Fee record deleted successfully"}
