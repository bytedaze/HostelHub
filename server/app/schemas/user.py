"""Pydantic schemas for user authentication and responses."""

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserRegister(BaseModel):
    """Fields accepted when a new user registers."""

    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.STUDENT
    phone: str


class UserLogin(BaseModel):
    """Credentials accepted during login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Public user data. Password hashes are intentionally excluded."""

    id: str
    name: str
    email: EmailStr
    role: UserRole
    phone: str


class AuthResponse(BaseModel):
    """Response returned after a successful login."""

    access_token: str
    token_type: str
    user: UserResponse
