"""Shared pytest fixtures for backend tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from database import Base, get_db
from main import app


@pytest.fixture()
def client():
    """A TestClient backed by a fresh in-memory SQLite database per test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    # Not using the `with TestClient(...)` context manager: that would run
    # the app's lifespan and create a real prelegal.db file on disk, which
    # these tests don't need since get_db is overridden above.
    yield TestClient(app)
    app.dependency_overrides.clear()
