"""Biometric authentication service"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.biometric import BiometricAuth
from app.models.user import User
from app.schemas.biometric import BiometricEnrollRequest, BiometricStatus


async def enroll_biometric(
    db: AsyncSession,
    user_id: UUID,
    *,
    device_id: str,
    biometric_type: str,
) -> BiometricAuth:
    """Enroll a biometric authentication method for a user"""
    # Check if already enrolled on this device
    existing = await db.execute(
        select(BiometricAuth).where(
            BiometricAuth.user_id == user_id,
            BiometricAuth.device_id == device_id,
            BiometricAuth.biometric_type == biometric_type,
        )
    )
    
    existing_auth = existing.scalar_one_or_none()
    if existing_auth:
        existing_auth.enrolled = True
        existing_auth.updated_at = datetime.now(UTC)
    else:
        existing_auth = BiometricAuth(
            user_id=user_id,
            device_id=device_id,
            biometric_type=biometric_type,
            enrolled=True,
        )
        db.add(existing_auth)
    
    await db.commit()
    await db.refresh(existing_auth)
    return existing_auth


async def get_biometric_status(
    db: AsyncSession,
    user_id: UUID,
    device_id: str,
) -> list[BiometricStatus]:
    """Get biometric enrollment status for a device"""
    result = await db.execute(
        select(BiometricAuth).where(
            BiometricAuth.user_id == user_id,
            BiometricAuth.device_id == device_id,
        )
    )
    
    auths = result.scalars().all()
    return [
        BiometricStatus(
            enrolled=auth.enrolled,
            device_id=auth.device_id,
            biometric_type=auth.biometric_type,
            last_used=auth.last_used.isoformat() if auth.last_used else None,
        )
        for auth in auths
    ]


async def authenticate_biometric(
    db: AsyncSession,
    user_id: UUID,
    device_id: str,
    biometric_type: str,
) -> bool:
    """Verify biometric authentication exists and is enrolled"""
    result = await db.execute(
        select(BiometricAuth).where(
            BiometricAuth.user_id == user_id,
            BiometricAuth.device_id == device_id,
            BiometricAuth.biometric_type == biometric_type,
            BiometricAuth.enrolled == True,  # noqa: E712
        )
    )
    
    auth = result.scalar_one_or_none()
    if not auth:
        return False
    
    # Update last used timestamp
    auth.last_used = datetime.now(UTC)
    await db.commit()
    return True


async def remove_biometric(
    db: AsyncSession,
    user_id: UUID,
    device_id: str,
    biometric_type: str,
) -> bool:
    """Remove biometric enrollment"""
    await db.execute(
        delete(BiometricAuth).where(
            BiometricAuth.user_id == user_id,
            BiometricAuth.device_id == device_id,
            BiometricAuth.biometric_type == biometric_type,
        )
    )
    await db.commit()
    return True


async def disable_all_biometrics(
    db: AsyncSession,
    user_id: UUID,
) -> int:
    """Disable all biometric enrollments for a user"""
    result = await db.execute(
        delete(BiometricAuth).where(BiometricAuth.user_id == user_id)
    )
    await db.commit()
    return result.rowcount
