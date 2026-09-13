"""Pydantic models for authentication."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Fake login request body. No password: this is a placeholder auth
    flow for the V1 foundation and gets replaced by real authentication
    in a later ticket."""

    email: EmailStr


class UserResponse(BaseModel):
    """User information response."""

    id: int
    email: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    """Authentication response with user info."""

    user: UserResponse
    message: str
