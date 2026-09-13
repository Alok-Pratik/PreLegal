"""Fake authentication business logic for the V1 foundation.

There is no password check here by design (see SCRUM-5): entering an
email is enough to enter the platform. This is a placeholder to be
replaced by real authentication in a later ticket.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from database import User


class AuthService:
    """Handles the fake authentication business logic."""

    def __init__(self, db: Session):
        self.db = db

    def login(self, email: str) -> User:
        """Get or create a user by email and log them in. No password
        is checked or stored."""
        user = self.db.query(User).filter(User.email == email).first()
        if user:
            return user

        user = User(email=email)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user_by_id(self, user_id: int) -> User:
        """
        Get user by ID.
        Raises: HTTPException if user not found
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
