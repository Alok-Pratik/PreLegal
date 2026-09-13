"""FastAPI dependencies for the fake V1 authentication flow.

The session cookie is just a user id with no signature or expiry. This
is intentional for now (see SCRUM-5): there is no real authentication
yet, only enough session tracking to keep a user "logged in" across
requests. Replace with signed/JWT sessions when real auth is built.
"""

from typing import Optional

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, User
from services.auth_service import AuthService

SESSION_COOKIE_NAME = "session_user_id"


async def get_current_user(
    session_user_id: Optional[str] = Cookie(None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to get the current "logged in" user from the session cookie.
    Raises 401 if not authenticated.
    """
    if not session_user_id or not session_user_id.isdigit():
        raise HTTPException(status_code=401, detail="Not authenticated")

    auth_service = AuthService(db)
    return auth_service.get_user_by_id(int(session_user_id))


async def get_current_user_optional(
    session_user_id: Optional[str] = Cookie(None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Optional version of get_current_user - returns None if not authenticated.
    """
    if not session_user_id or not session_user_id.isdigit():
        return None

    try:
        auth_service = AuthService(db)
        return auth_service.get_user_by_id(int(session_user_id))
    except HTTPException:
        return None
