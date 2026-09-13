"""Authentication business logic: sign up, sign in, and session lookup."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from core.security import hash_password, verify_password
from database import User


class AuthService:
    """Handles authentication business logic."""

    def __init__(self, db: Session):
        self.db = db

    def signup(self, email: str, password: str) -> User:
        """Create a new account. Raises 409 if the email is already taken."""
        if self.db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=409, detail="An account with this email already exists")

        user = User(email=email, hashed_password=hash_password(password))
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def signin(self, email: str, password: str) -> User:
        """Authenticate an existing account. Raises 401 on any mismatch."""
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
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
