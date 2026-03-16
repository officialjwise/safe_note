from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

storage_uri = settings.RATE_LIMIT_REDIS_URL or (
    f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"
)

limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)
