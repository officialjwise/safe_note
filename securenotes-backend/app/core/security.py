from __future__ import annotations

import hashlib
import hmac
import os
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt
import bcrypt
from fastapi import HTTPException, status

from app.config import settings


def hash_password(password: str) -> str:
    """Hash passwords with bcrypt.

    Security rationale:
    bcrypt is adaptive and intentionally expensive, reducing brute-force speed.
    """
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


def _create_token(user_id: UUID, token_type: str, expires_delta: timedelta) -> tuple[str, str]:
    jti = str(uuid4())
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    encoded = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded, jti


def create_access_token(user_id: UUID) -> tuple[str, str]:
    return _create_token(user_id, "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(user_id: UUID) -> tuple[str, str]:
    raw_token, _ = _create_token(user_id, "refresh", timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    return raw_token, hash_token(raw_token)


def verify_token(token: str, expected_type: str) -> dict:
    """Validate JWT signature, expiration, and token type.

    Security rationale:
    Always return the same generic client error to avoid token oracle leaks.
    """

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["sub", "type", "exp", "iat", "jti"]},
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required") from exc

    if payload.get("type") != expected_type:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    return payload


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def compare_token_hashes(raw_token: str, stored_hash: str) -> bool:
    """Timing-safe token hash comparison."""

    return hmac.compare_digest(hash_token(raw_token), stored_hash)


def derive_user_key(user_id: UUID) -> bytes:
    """Derive deterministic per-user AES key.

    Security rationale:
    Key is derived at runtime from user_id + server pepper and never persisted.
    Database theft alone is insufficient to decrypt note contents.
    """

    return hashlib.pbkdf2_hmac(
        "sha256",
        settings.ENCRYPTION_PEPPER.encode("utf-8"),
        str(user_id).encode("utf-8"),
        260_000,
        dklen=32,
    )


def random_nonce(size: int = 12) -> bytes:
    return os.urandom(size)
