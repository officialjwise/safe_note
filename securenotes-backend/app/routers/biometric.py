"""Biometric authentication endpoints"""

from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.biometric import BiometricEnrollRequest, BiometricStatus
from app.schemas.common import MessageResponse
from app.services.biometric_service import (
    authenticate_biometric,
    disable_all_biometrics,
    enroll_biometric,
    get_biometric_status,
    remove_biometric,
)
from app.core.rate_limiter import limiter

router = APIRouter(prefix="/biometric")


@router.post("/enroll", tags=["biometric"])
@limiter.limit("10/hour")
async def enroll(
    request: Request,
    payload: BiometricEnrollRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Enroll biometric authentication for current device"""
    await enroll_biometric(
        db,
        current_user.id,
        device_id=payload.device_id,
        biometric_type=payload.biometric_type,
    )
    return MessageResponse(detail=f"{payload.biometric_type} enrollment successful")


@router.get("/status/{device_id}", tags=["biometric"])
async def get_status(
    request: Request,
    device_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get biometric enrollment status for a device"""
    status_list = await get_biometric_status(db, current_user.id, device_id)
    return {"device_id": device_id, "biometrics": status_list}


@router.post("/authenticate", tags=["biometric"])
@limiter.limit("20/minute")
async def authenticate(
    request: Request,
    payload: BiometricEnrollRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Verify biometric authentication"""
    is_valid = await authenticate_biometric(
        db,
        current_user.id,
        payload.device_id,
        payload.biometric_type,
    )

    if not is_valid:
        return MessageResponse(
            detail="Biometric authentication failed",
            status_code=401,
        )

    return MessageResponse(detail="Biometric authentication successful")


@router.delete("/{device_id}/{biometric_type}", tags=["biometric"])
async def remove(
    request: Request,
    device_id: str,
    biometric_type: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Remove biometric enrollment"""
    await remove_biometric(db, current_user.id, device_id, biometric_type)
    return MessageResponse(detail=f"{biometric_type} enrollment removed")


@router.post("/disable-all", tags=["biometric"])
async def disable_all(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Disable all biometric enrollments"""
    count = await disable_all_biometrics(db, current_user.id)
    return MessageResponse(detail=f"All {count} biometric enrollments disabled")
