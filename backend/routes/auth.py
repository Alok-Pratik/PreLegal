"""Authentication routes.

V1 foundation only: login is a placeholder with no password (see
SCRUM-5). Real authentication is a future ticket.
"""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from database import get_db, User
from models.auth import LoginRequest, UserResponse, AuthResponse
from services.auth_service import AuthService
from core.dependencies import get_current_user, SESSION_COOKIE_NAME

router = APIRouter(prefix="/api/auth", tags=["auth"])

COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Fake login: get or create a user by email, no password required."""
    auth_service = AuthService(db)
    user = auth_service.login(request.email)

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=str(user.id),
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
    )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        message="Signed in successfully",
    )


@router.post("/logout")
async def logout(response: Response):
    """Sign out by clearing the session cookie."""
    response.delete_cookie(key=SESSION_COOKIE_NAME)
    return {"message": "Signed out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return UserResponse.model_validate(current_user)
