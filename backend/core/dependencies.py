"""FastAPI dependencies for session-based authentication (SCRUM-8).

The session cookie holds a signed, expiring token (see core/security.py)
rather than a raw user id, so it can't be forged or tampered with client-side.
"""

from typing import Optional

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from core.security import read_session_token
from database import get_db, User
from services.auth_service import AuthService

SESSION_COOKIE_NAME = "session_token"


async def get_current_user(
    session_token: Optional[str] = Cookie(None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to get the current logged-in user from the session cookie.
    Raises 401 if not authenticated.
    """
    user_id = read_session_token(session_token) if session_token else None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    auth_service = AuthService(db)
    return auth_service.get_user_by_id(user_id)


async def get_current_user_optional(
    session_token: Optional[str] = Cookie(None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Optional version of get_current_user - returns None if not authenticated.
    """
    user_id = read_session_token(session_token) if session_token else None
    if user_id is None:
        return None

    try:
        auth_service = AuthService(db)
        return auth_service.get_user_by_id(user_id)
    except HTTPException:
        return None
