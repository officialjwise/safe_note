from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("securenotes")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")
        logger.warning(
            "validation_error",
            extra={
                "request_id": request_id,
                "path": str(request.url.path),
                "errors": exc.errors(),
            },
        )
        return JSONResponse(status_code=422, content={"detail": "Invalid request data"})

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")
        if exc.status_code >= 500:
            logger.exception("http_exception", extra={"request_id": request_id, "status_code": exc.status_code})
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")
        logger.exception("unhandled_exception", extra={"request_id": request_id})
        return JSONResponse(status_code=500, content={"detail": "An internal error occurred"})
