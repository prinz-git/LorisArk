import os
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_users.db")

from app.main import app
from app.database import Base, get_db

TEST_DB_URL = os.environ["DATABASE_URL"]

engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(bind=engine)


# ---------- DB Override ----------
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ---------- Clean DB before each test ----------
@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


# ---------- API Client ----------
@pytest.fixture
def client():
    return TestClient(app)


# ---------- User Factory ----------
@pytest.fixture
def user_data():
    return {
        "email": f"{uuid.uuid4()}@test.com",
        "password": "123456",
        "full_name": "Test User",
        "role": "host",
    }


# ---------- Register User ----------
@pytest.fixture
def registered_user(client, user_data):
    client.post("/register", json=user_data)
    return user_data


# ---------- Login Token ----------
@pytest.fixture
def auth_token(client, registered_user):
    resp = client.post("/login", json={
        "email": registered_user["email"],
        "password": registered_user["password"]
    })
    return resp.json()["access_token"]
