"""Registration and login endpoints."""

from fastapi import APIRouter, HTTPException, status

from app.database import db
from app.models.user import User
from app.schemas.user import AuthResponse, UserLogin, UserRegister, UserResponse
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])
users_collection = db["users"]


def to_user_response(user_document: dict) -> UserResponse:
    """Convert a MongoDB document into the public response shape."""

    return UserResponse(
        id=str(user_document["_id"]),
        name=user_document["name"],
        email=user_document["email"],
        role=user_document["role"],
        phone=user_document["phone"],
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister) -> UserResponse:
    """Register a user after confirming that their email is available."""

    if await users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email is already registered")

    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        phone=user_data.phone,
    )
    user_document = user.model_dump()
    insert_result = await users_collection.insert_one(user_document)
    user_document["_id"] = insert_result.inserted_id

    return to_user_response(user_document)


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin) -> AuthResponse:
    """Verify credentials and return a JWT plus public user data."""

    user_document = await users_collection.find_one({"email": credentials.email})
    if not user_document or not verify_password(
        credentials.password, user_document["password_hash"]
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    role = getattr(user_document["role"], "value", user_document["role"])
    token = create_access_token(str(user_document["_id"]), role=role)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=to_user_response(user_document),
    )
