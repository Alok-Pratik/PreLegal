"""Authentication routes: sign up, sign in, sign out (SCRUM-8)."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from core.dependencies import get_current_user, SESSION_COOKIE_NAME
from core.security import create_session_token, SESSION_MAX_AGE_SECONDS
from database import get_db, User
from models.auth import SignupRequest, SigninRequest, UserResponse, AuthResponse
from services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_session_cookie(response: Response, user: User) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=create_session_token(user.id),
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=SESSION_MAX_AGE_SECONDS,
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest, response: Response, db: Session = Depends(get_db)):
    """Create a new account and sign the user in."""
    auth_service = AuthService(db)
    user = auth_service.signup(request.email, request.password)

    _set_session_cookie(response, user)

    return AuthResponse(user=UserResponse.model_validate(user), message="Account created successfully")


@router.post("/signin", response_model=AuthResponse)
async def signin(request: SigninRequest, response: Response, db: Session = Depends(get_db)):
    """Sign in to an existing account."""
    auth_service = AuthService(db)
    user = auth_service.signin(request.email, request.password)

    _set_session_cookie(response, user)

    return AuthResponse(user=UserResponse.model_validate(user), message="Signed in successfully")


@router.post("/logout")
async def logout(response: Response):
    """Sign out by clearing the session cookie."""
    response.delete_cookie(key=SESSION_COOKIE_NAME)
    return {"message": "Signed out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return UserResponse.model_validate(current_user)
