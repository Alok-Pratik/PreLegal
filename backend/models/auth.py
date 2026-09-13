"""Pydantic models for authentication."""

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    """Sign-up request body: create a new account."""

    email: EmailStr
    # max_length=72 matches bcrypt's hard limit (it raises ValueError past
    # that many bytes rather than truncating) so an over-long password is a
    # clean 422 instead of an unhandled 500.
    password: str = Field(min_length=8, max_length=72)


class SigninRequest(BaseModel):
    """Sign-in request body: authenticate an existing account."""

    email: EmailStr
    password: str = Field(max_length=72)


class UserResponse(BaseModel):
    """User information response."""

    id: int
    email: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    """Authentication response with user info."""

    user: UserResponse
    message: str
