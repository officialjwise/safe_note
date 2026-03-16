from __future__ import annotations

import redis.asyncio as aioredis

from app.config import settings


class RedisClient:
    """Redis pools split by concern.

    db=0 rate limiting, db=1 token blacklist, db=2 lockout tracking, db=3 password reset.
    Separation allows selective operations without cross-impact.
    """

    def __init__(self) -> None:
        self._rate_limit_pool: aioredis.Redis | None = None
        self._blacklist_pool: aioredis.Redis | None = None
        self._lockout_pool: aioredis.Redis | None = None
        self._password_reset_pool: aioredis.Redis | None = None

    async def init(self) -> None:
        base = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}"
        self._rate_limit_pool = aioredis.from_url(f"{base}/0", decode_responses=True)
        self._blacklist_pool = aioredis.from_url(f"{base}/1", decode_responses=True)
        self._lockout_pool = aioredis.from_url(f"{base}/2", decode_responses=True)
        self._password_reset_pool = aioredis.from_url(f"{base}/3", decode_responses=True)

    async def close(self) -> None:
        for pool in [self._rate_limit_pool, self._blacklist_pool, self._lockout_pool, self._password_reset_pool]:
            if pool is not None:
                await pool.aclose()

    async def blacklist_token(self, jti: str, expires_in_seconds: int) -> None:
        if self._blacklist_pool is None:
            return
        await self._blacklist_pool.setex(f"blacklist:{jti}", expires_in_seconds, "1")

    async def is_token_blacklisted(self, jti: str) -> bool:
        if self._blacklist_pool is None:
            return False
        return await self._blacklist_pool.exists(f"blacklist:{jti}") == 1

    async def increment_failed_login(self, email: str) -> int:
        if self._lockout_pool is None:
            return 0
        key = f"failed_login:{email}"
        count = await self._lockout_pool.incr(key)
        if count == 1:
            await self._lockout_pool.expire(key, 900)
        return count

    async def set_lockout(self, email: str, duration_seconds: int = 900) -> None:
        if self._lockout_pool is None:
            return
        await self._lockout_pool.setex(f"lockout:{email}", duration_seconds, "1")

    async def is_locked_out(self, email: str) -> bool:
        if self._lockout_pool is None:
            return False
        return await self._lockout_pool.exists(f"lockout:{email}") == 1

    async def get_lockout_ttl(self, email: str) -> int:
        if self._lockout_pool is None:
            return -1
        return await self._lockout_pool.ttl(f"lockout:{email}")

    async def clear_failed_logins(self, email: str) -> None:
        if self._lockout_pool is None:
            return
        await self._lockout_pool.delete(f"failed_login:{email}", f"lockout:{email}")

    async def set_password_reset_code(self, email: str, code: str, expires_in_seconds: int = 1800) -> None:
        """Store password reset code in Redis with expiration"""
        if self._password_reset_pool is None:
            return
        key = f"password_reset:{email.lower()}"
        await self._password_reset_pool.setex(key, expires_in_seconds, code)

    async def get_password_reset_code(self, email: str) -> str | None:
        """Retrieve password reset code"""
        if self._password_reset_pool is None:
            return None
        key = f"password_reset:{email.lower()}"
        return await self._password_reset_pool.get(key)

    async def delete_password_reset_code(self, email: str) -> None:
        """Delete password reset code after use"""
        if self._password_reset_pool is None:
            return
        key = f"password_reset:{email.lower()}"
        await self._password_reset_pool.delete(key)


redis_client = RedisClient()
