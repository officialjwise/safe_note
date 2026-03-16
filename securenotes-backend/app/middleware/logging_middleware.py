from __future__ import annotations

import json
import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("securenotes.request")


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        payload = {
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
            "request_id": getattr(request.state, "request_id", None),
        }

        if request.url.path.startswith("/api/v1/auth"):
            payload["ip_address"] = request.client.host if request.client else None
            payload["user_agent"] = request.headers.get("user-agent")

        logger.info(json.dumps(payload, separators=(",", ":")))
        return response
