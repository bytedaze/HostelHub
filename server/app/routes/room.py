"""Room management and allocation endpoints."""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from pymongo import ReturnDocument
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import db
from app.schemas.room import (
    ActiveRoomAllocationResponse,
    AllocateRoomRequest,
    RoomAllocationResponse,
    RoomCreate,
    RoomResponse,
)
from app.utils.security import get_current_admin, get_current_user

router = APIRouter(prefix="/rooms", tags=["Rooms"])
rooms_collection = db["rooms"]
allocations_collection = db["room_allocations"]
users_collection = db["users"]


def object_id_or_400(value: str, label: str) -> ObjectId:
    """Convert a request ID to ObjectId and provide a friendly client error."""

    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return ObjectId(value)


def to_room_response(room_document: dict[str, Any]) -> RoomResponse:
    """Convert a MongoDB room document into the public response shape."""

    return RoomResponse(
        id=str(room_document["_id"]),
        room_number=room_document["room_number"],
        room_type=room_document["room_type"],
        capacity=room_document["capacity"],
        occupied_count=room_document.get("occupied_count", 0),
        fee_per_month=room_document["fee_per_month"],
        status=room_document.get("status", "available"),
    )


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_data: RoomCreate,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> RoomResponse:
    """Create an empty room. Only administrators can add rooms."""

    del current_admin
    room_document = {
        **room_data.model_dump(),
        "occupied_count": 0,
        "status": "available",
    }
    insert_result = await rooms_collection.insert_one(room_document)
    room_document["_id"] = insert_result.inserted_id
    return to_room_response(room_document)


@router.get("", response_model=list[RoomResponse])
async def list_rooms(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[RoomResponse]:
    """List all rooms for any authenticated user."""

    del current_user
    return [to_room_response(room) async for room in rooms_collection.find().sort("room_number", 1)]


@router.get("/allocations", response_model=list[ActiveRoomAllocationResponse])
async def list_active_allocations(
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> list[ActiveRoomAllocationResponse]:
    """Return active allocations enriched with student and room details."""

    del current_admin
    allocations: list[ActiveRoomAllocationResponse] = []
    active_allocations = allocations_collection.find({"status": "active"}).sort(
        "allocated_date", -1
    )

    async for allocation in active_allocations:
        student = None
        if ObjectId.is_valid(allocation["student_id"]):
            student = await users_collection.find_one(
                {"_id": ObjectId(allocation["student_id"]), "role": "student"}
            )
        room = await rooms_collection.find_one({"_id": allocation["room_id"]})

        # Active allocations should always have both related documents. Ignore
        # an incomplete record rather than returning unusable table data.
        if not student or not room:
            continue

        allocations.append(
            ActiveRoomAllocationResponse(
                id=str(allocation["_id"]),
                student_id=allocation["student_id"],
                student_name=student["name"],
                student_email=student["email"],
                room_id=str(allocation["room_id"]),
                room_number=room["room_number"],
                room_type=room["room_type"],
                allocated_date=allocation["allocated_date"],
                status=allocation["status"],
            )
        )

    return allocations


@router.get("/allocate")
async def allocation_path_guard() -> None:
    """Prevent the allocation action from being treated as a room ID."""

    raise HTTPException(status_code=405, detail="Use POST /rooms/allocate")


@router.get("/my-allocation")
async def get_my_allocation(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Return the current user's active allocation and its room details."""

    allocation = await allocations_collection.find_one(
        {"student_id": str(current_user["_id"]), "status": "active"}
    )
    if not allocation:
        return {"message": "You do not have an active room allocation."}

    room = await rooms_collection.find_one({"_id": allocation["room_id"]})
    if not room:
        raise HTTPException(status_code=404, detail="Allocated room was not found")

    return {
        "id": str(allocation["_id"]),
        "student_id": allocation["student_id"],
        "room_id": str(allocation["room_id"]),
        "allocated_date": allocation["allocated_date"],
        "status": allocation["status"],
        "room": to_room_response(room),
    }


@router.post("/allocate", response_model=RoomAllocationResponse)
async def allocate_room(
    allocation_data: AllocateRoomRequest,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> RoomAllocationResponse:
    """Allocate a room to a student when they have no active allocation."""

    del current_admin
    room_object_id = object_id_or_400(allocation_data.room_id, "room ID")

    if not ObjectId.is_valid(allocation_data.student_id):
        raise HTTPException(status_code=404, detail="Student not found")

    student = await users_collection.find_one(
        {"_id": ObjectId(allocation_data.student_id), "role": "student"}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing_allocation = await allocations_collection.find_one(
        {"student_id": allocation_data.student_id, "status": "active"}
    )
    if existing_allocation:
        raise HTTPException(status_code=400, detail="Student already has an active room allocation")

    room = await rooms_collection.find_one_and_update(
        {"_id": room_object_id, "$expr": {"$lt": ["$occupied_count", "$capacity"]}},
        {"$inc": {"occupied_count": 1}},
        return_document=ReturnDocument.AFTER,
    )
    if not room:
        room_exists = await rooms_collection.find_one({"_id": room_object_id})
        if not room_exists:
            raise HTTPException(status_code=404, detail="Room not found")
        raise HTTPException(status_code=400, detail="Room is full")

    new_occupied_count = room["occupied_count"]
    new_status = "full" if new_occupied_count >= room["capacity"] else "available"
    await rooms_collection.update_one(
        {"_id": room_object_id}, {"$set": {"status": new_status}}
    )

    allocation_document = {
        "student_id": allocation_data.student_id,
        "room_id": room_object_id,
        "allocated_date": datetime.now(timezone.utc),
        "status": "active",
    }
    insert_result = await allocations_collection.insert_one(allocation_document)
    allocation_document["_id"] = insert_result.inserted_id
    updated_room = await rooms_collection.find_one({"_id": room_object_id})

    return RoomAllocationResponse(
        id=str(allocation_document["_id"]),
        student_id=allocation_document["student_id"],
        room_id=str(room_object_id),
        allocated_date=allocation_document["allocated_date"],
        status=allocation_document["status"],
        room=to_room_response(updated_room),
    )


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> RoomResponse:
    """Return one room for any authenticated user."""

    del current_user
    room = await rooms_collection.find_one({"_id": object_id_or_400(room_id, "room ID")})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return to_room_response(room)


@router.post("/vacate/{allocation_id}")
async def vacate_room(
    allocation_id: str,
    current_admin: dict[str, Any] = Depends(get_current_admin),
) -> dict[str, str]:
    """Mark an active allocation as vacated and free its room space."""

    del current_admin
    allocation_object_id = object_id_or_400(allocation_id, "allocation ID")
    allocation = await allocations_collection.find_one_and_update(
        {"_id": allocation_object_id, "status": "active"},
        {"$set": {"status": "vacated", "vacated_date": datetime.now(timezone.utc)}},
        return_document=ReturnDocument.BEFORE,
    )
    if not allocation:
        raise HTTPException(status_code=404, detail="Active allocation not found")

    room = await rooms_collection.find_one_and_update(
        {"_id": allocation["room_id"], "occupied_count": {"$gt": 0}},
        {"$inc": {"occupied_count": -1}},
        return_document=ReturnDocument.AFTER,
    )
    if room and room.get("status") == "full":
        await rooms_collection.update_one(
            {"_id": allocation["room_id"]}, {"$set": {"status": "available"}}
        )

    return {"message": "Room allocation vacated successfully"}
