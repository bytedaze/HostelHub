"""Password hashing and JWT helpers."""

import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.database import db

load_dotenv()

jwt_secret = os.getenv("JWT_SECRET")
jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")

if not jwt_secret:
    raise RuntimeError("JWT_SECRET must be set in the environment")

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
users_collection = db["users"]

MIN_PASSWORD_LENGTH = 8
ALLOWED_SPECIAL_CHARACTERS = "!@#$%^"


def is_password_valid(password: str) -> bool:
    """Check registration rules without including the supplied password in errors."""

    return (
        len(password) >= MIN_PASSWORD_LENGTH
        and re.search(r"[a-z]", password) is not None
        and re.search(r"[A-Z]", password) is not None
        and re.search(r"\d", password) is not None
        and re.fullmatch(r"[A-Za-z0-9!@#$%^]+", password) is not None
    )


def hash_password(password: str) -> str:
    """Return a secure bcrypt hash for a plain-text password."""

    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plain-text password against its stored hash."""

    return password_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str, role: str | None = None, expires_minutes: int = 60
) -> str:
    """Create a signed JWT containing the user's identifier and optional role."""

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload: dict[str, Any] = {"sub": subject, "exp": expires_at}
    if role:
        payload["role"] = role
    return jwt.encode(payload, jwt_secret, algorithm=jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode a JWT, returning None when it is invalid or expired."""

    try:
        return jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    """Decode the bearer token and return its matching MongoDB user document."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub") if payload else None

    if not user_id:
        raise credentials_exception

    try:
        from bson import ObjectId

        user_document = await users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception from None

    if not user_document:
        raise credentials_exception

    return user_document


async def get_current_admin(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Allow access only when the authenticated user has the admin role."""

    role = current_user.get("role")
    role_value = getattr(role, "value", role)
    if role_value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user
