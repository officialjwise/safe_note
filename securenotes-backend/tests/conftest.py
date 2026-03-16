from __future__ import annotations

import os
from collections.abc import AsyncGenerator, Generator
from uuid import uuid4

import fakeredis.aioredis
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("REDIS_PASSWORD", "test_password_should_be_at_least_32_chars_long")
os.environ.setdefault("JWT_SECRET_KEY", "test_secret_key_must_be_at_least_32_chars_long")
os.environ.setdefault("ENCRYPTION_PEPPER", "test_pepper_must_be_at_least_32_chars_long")
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost:8081"]')

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.redis_client import redis_client  # noqa: E402


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine("sqlite+aiosqlite:///./test.db", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    session_maker = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)
    async with session_maker() as session:
        yield session


@pytest.fixture(autouse=True)
async def redis_mock() -> AsyncGenerator[None, None]:
    redis_client._rate_limit_pool = fakeredis.aioredis.FakeRedis(decode_responses=True)
    redis_client._blacklist_pool = fakeredis.aioredis.FakeRedis(decode_responses=True)
    redis_client._lockout_pool = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield
    await redis_client._rate_limit_pool.flushdb()
    await redis_client._blacklist_pool.flushdb()
    await redis_client._lockout_pool.flushdb()


@pytest.fixture
def test_client(db_session: AsyncSession) -> Generator[TestClient, None, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.state.limiter.enabled = False
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user() -> dict[str, str]:
    return {
        "email": f"user-{uuid4()}@example.com",
        "password": "StrongPass1!",
    }
