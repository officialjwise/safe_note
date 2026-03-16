from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog

logger = logging.getLogger("securenotes.audit")


async def log_security_event(
    db: AsyncSession,
    *,
    event_type: str,
    success: bool,
    user_id: UUID | None,
    ip_address: str | None,
    user_agent: str | None,
    request_id: str | None,
    metadata: dict | None = None,
) -> None:
    payload = {
        "timestamp": datetime.now(UTC).isoformat(),
        "event_type": event_type,
        "user_id": str(user_id) if user_id else None,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "request_id": request_id,
        "success": success,
    }
    logger.info(json.dumps(payload, separators=(",", ":")))

    entry = AuditLog(
        user_id=user_id,
        event_type=event_type,
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id,
        success=success,
        metadata_json=metadata,
    )
    db.add(entry)
