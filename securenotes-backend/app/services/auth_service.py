from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import (
    compare_token_hashes,
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.redis_client import RedisClient
from app.schemas.auth import TokenResponse
from app.services.audit_service import log_security_event
from app.services.email_service import email_service


def _auth_required() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


async def register_user(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    request_meta: dict,
) -> User:
    existing = await db.execute(select(User).where(User.email == email.lower().strip()))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(email=email.lower().strip(), password_hash=hash_password(password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await log_security_event(
        db,
        event_type="REGISTER",
        success=True,
        user_id=user.id,
        ip_address=request_meta.get("ip_address"),
        user_agent=request_meta.get("user_agent"),
        request_id=request_meta.get("request_id"),
    )
    await db.commit()

    # Send welcome email asynchronously
    if settings.EMAIL_ADDRESS:
        try:
            await email_service.send_welcome_email(user.email)
        except Exception as e:
            print(f"[WARN] Failed to send welcome email: {str(e)}")

    return user


async def login_user(
    db: AsyncSession,
    redis: RedisClient,
    *,
    email: str,
    password: str,
    request_meta: dict,
) -> TokenResponse:
    normalized_email = email.lower().strip()

    if await redis.is_locked_out(normalized_email):
        ttl = await redis.get_lockout_ttl(normalized_email)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account temporarily locked",
            headers={"Retry-After": str(max(ttl, 1))},
        )

    user_result = await db.execute(select(User).where(User.email == normalized_email))
    user = user_result.scalar_one_or_none()

    # Constant-time-ish path to reduce user enumeration side-channel.
    password_ok = verify_password(password, user.password_hash) if user else verify_password(password, hash_password("dummy-password-A1!"))

    if user is None or not password_ok:
        count = await redis.increment_failed_login(normalized_email)
        if count >= 5:
            await redis.set_lockout(normalized_email, 900)
        await log_security_event(
            db,
            event_type="FAILED_LOGIN",
            success=False,
            user_id=user.id if user else None,
            ip_address=request_meta.get("ip_address"),
            user_agent=request_meta.get("user_agent"),
            request_id=request_meta.get("request_id"),
        )
        await db.commit()
        raise _auth_required()

    await redis.clear_failed_logins(normalized_email)

    access_token, access_jti = create_access_token(user.id)
    refresh_token_raw, refresh_token_hash = create_refresh_token(user.id)

    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=refresh_token_hash,
        device_info=request_meta.get("user_agent"),
        expires_at=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)

    await log_security_event(
        db,
        event_type="SUCCESSFUL_LOGIN",
        success=True,
        user_id=user.id,
        ip_address=request_meta.get("ip_address"),
        user_agent=request_meta.get("user_agent"),
        request_id=request_meta.get("request_id"),
        metadata={"access_jti": access_jti},
    )
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_raw,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def refresh_tokens(
    db: AsyncSession,
    redis: RedisClient,
    *,
    raw_refresh_token: str,
    request_meta: dict,
) -> TokenResponse:
    payload = verify_token(raw_refresh_token, expected_type="refresh")
    refresh_jti = payload.get("jti")
    if await redis.is_token_blacklisted(refresh_jti):
        raise _auth_required()

    user_id = UUID(payload["sub"])
    token_hash = raw_refresh_token

    token_rows = await db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
    )
    candidates = token_rows.scalars().all()

    selected: RefreshToken | None = None
    for candidate in candidates:
        if compare_token_hashes(token_hash, candidate.token_hash):
            selected = candidate
            break

    if selected is None or selected.expires_at < datetime.now(UTC):
        raise _auth_required()

    selected.revoked = True
    selected.revoked_at = datetime.now(UTC)

    access_token, access_jti = create_access_token(user_id)
    new_refresh_raw, new_refresh_hash = create_refresh_token(user_id)

    db.add(
        RefreshToken(
            user_id=user_id,
            token_hash=new_refresh_hash,
            device_info=request_meta.get("user_agent"),
            expires_at=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )

    await log_security_event(
        db,
        event_type="TOKEN_REFRESH",
        success=True,
        user_id=user_id,
        ip_address=request_meta.get("ip_address"),
        user_agent=request_meta.get("user_agent"),
        request_id=request_meta.get("request_id"),
        metadata={"access_jti": access_jti},
    )
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_raw,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def logout_user(
    db: AsyncSession,
    redis: RedisClient,
    *,
    current_user: User,
    access_token_jti: str,
    token_ttl_seconds: int,
    request_meta: dict,
) -> None:
    await redis.blacklist_token(access_token_jti, token_ttl_seconds)

    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == current_user.id, RefreshToken.revoked.is_(False))
        .values(revoked=True, revoked_at=datetime.now(UTC))
    )

    await log_security_event(
        db,
        event_type="LOGOUT",
        success=True,
        user_id=current_user.id,
        ip_address=request_meta.get("ip_address"),
        user_agent=request_meta.get("user_agent"),
        request_id=request_meta.get("request_id"),
    )
    await db.commit()


async def request_password_reset(
    db: AsyncSession,
    redis: RedisClient,
    *,
    email: str,
    request_meta: dict,
) -> None:
    """Request password reset with code sent to email"""
    import secrets
    
    user = await db.execute(select(User).where(User.email == email.lower().strip()))
    user = user.scalar_one_or_none()

    # Always return success for security (don't reveal if email exists)
    if not user:
        return

    # Generate 6-digit reset code
    reset_code = f"{secrets.randbelow(1000000):06d}"

    # Store in Redis with 30 minute expiry
    await redis.set_password_reset_code(email.lower(), reset_code, expires_in_seconds=30 * 60)

    # Send email with reset code
    if settings.EMAIL_ADDRESS:
        try:
            await email_service.send_password_reset_email(user.email, reset_code)
        except Exception as e:
            print(f"[WARN] Failed to send password reset email: {str(e)}")
    
    # Log code in development mode for testing
    if settings.APP_ENV == "development":
        print(f"[DEV] Password reset code for {email}: {reset_code}")

    await log_security_event(
        db,
        event_type="PASSWORD_RESET_REQUEST",
        success=True,
        user_id=user.id,
        ip_address=request_meta.get("ip_address"),
        user_agent=request_meta.get("user_agent"),
        request_id=request_meta.get("request_id"),
    )


async def verify_reset_code(
    redis: RedisClient,
    email: str,
    code: str,
) -> bool:
    """Verify password reset code"""
    stored_code = await redis.get_password_reset_code(email.lower())
    if not stored_code:
        return False
    return stored_code == code


async def reset_password_confirm(
    db: AsyncSession,
    redis: RedisClient,
    *,
    email: str,
    code: str,
    new_password: str,
    request_meta: dict,
) -> None:
    """Confirm password reset and update password"""
    user = await db.execute(select(User).where(User.email == email.lower().strip()))
    user = user.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Verify code
    is_valid = await verify_reset_code(redis, email, code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code",
        )

    # Update password
    user.password_hash = hash_password(new_password)
    await db.merge(user)
    await db.commit()

    # Delete reset code
    await redis.delete_password_reset_code(email.lower())

    # Send confirmation email
    if settings.EMAIL_ADDRESS:
        try:
            await email_service.send_password_reset_confirmation(user.email)
        except Exception as e:
            print(f"[WARN] Failed to send password reset confirmation email: {str(e)}")

    await log_security_event(
        db,
        event_type="PASSWORD_RESET_CONFIRM",
        success=True,
        user_id=user.id,
        ip_address=request_meta.get("ip_address"),
        user_agent=request_meta.get("user_agent"),
        request_id=request_meta.get("request_id"),
    )
