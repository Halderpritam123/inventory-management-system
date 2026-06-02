"""
Test fixtures for the Inventory & Order Management backend.

Uses SQLite in-memory so tests run without a real PostgreSQL instance.
The Product model uses PortableUUID (app.shared.types) which maps to
VARCHAR(36) on SQLite and native UUID on PostgreSQL.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Register models with Base *before* importing Base so create_all sees them.
import app.modules.products.models  # noqa: F401
import app.modules.customers.models  # noqa: F401
import app.modules.orders.models  # noqa: F401

from app.core.database import Base

SQLITE_URL = "sqlite://"


@pytest.fixture(scope="function")
def engine():
    """Create a fresh in-memory SQLite engine with all tables for each test."""
    eng = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)
    eng.dispose()


@pytest.fixture(scope="function")
def db(engine):
    """Provide a SQLAlchemy session bound to the test engine."""
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db):
    """
    FastAPI TestClient with the get_db dependency overridden to use the
    in-memory SQLite session.
    """
    from app.core.database import get_db
    from app.main import app

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
