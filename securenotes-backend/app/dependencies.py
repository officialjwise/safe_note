from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.redis_client import redis_client
from app.core.security import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = verify_token(token, expected_type="access")
    jti = payload.get("jti")

    if jti and await redis_client.is_token_blacklisted(jti):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    user_id = UUID(payload["sub"])
    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


def extract_access_token_jti(token: str) -> str:
    payload = verify_token(token, expected_type="access")
    return str(payload["jti"])


def access_token_ttl_seconds(token: str) -> int:
    payload = verify_token(token, expected_type="access")
    exp = datetime.fromtimestamp(payload["exp"], tz=UTC)
    ttl = int((exp - datetime.now(UTC)).total_seconds())
    return max(ttl, 1)
