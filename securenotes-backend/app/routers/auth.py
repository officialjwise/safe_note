from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import access_token_ttl_seconds, extract_access_token_jti, get_current_user, oauth2_scheme
from app.models.user import User
from app.redis_client import redis_client
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    PasswordResetRequest,
    PasswordResetCodeVerifyRequest,
    PasswordResetConfirmRequest,
)
from app.schemas.common import MessageResponse
from app.services.auth_service import (
    login_user,
    logout_user,
    refresh_tokens,
    register_user,
    request_password_reset,
    verify_reset_code,
    reset_password_confirm,
)
from app.core.rate_limiter import limiter

router = APIRouter(prefix="/auth")


@router.post("/register", response_model=MessageResponse)
@limiter.limit("10/hour")
async def register(
    request: Request,
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await register_user(
        db,
        email=payload.email,
        password=payload.password,
        request_meta={
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "request_id": getattr(request.state, "request_id", None),
        },
    )
    return MessageResponse(detail="Account created")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await login_user(
        db,
        redis_client,
        email=payload.email,
        password=payload.password,
        request_meta={
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh(
    request: Request,
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await refresh_tokens(
        db,
        redis_client,
        raw_refresh_token=payload.refresh_token,
        request_meta={
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
) -> MessageResponse:
    await logout_user(
        db,
        redis_client,
        current_user=current_user,
        access_token_jti=extract_access_token_jti(token),
        token_ttl_seconds=access_token_ttl_seconds(token),
        request_meta={
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "request_id": getattr(request.state, "request_id", None),
        },
    )
    return MessageResponse(detail="Logged out")


@router.post("/password-reset/request", response_model=MessageResponse)
@limiter.limit("5/hour")
async def request_password_reset_endpoint(
    request: Request,
    payload: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await request_password_reset(
        db,
        redis_client,
        email=payload.email,
        request_meta={
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "request_id": getattr(request.state, "request_id", None),
        },
    )
    return MessageResponse(detail="Password reset code sent to email")


@router.post("/password-reset/verify", response_model=MessageResponse)
@limiter.limit("10/minute")
async def verify_reset_code_endpoint(
    request: Request,
    payload: PasswordResetCodeVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    is_valid = await verify_reset_code(redis_client, payload.email, payload.code)
    if not is_valid:
        return MessageResponse(detail="Invalid or expired reset code", status_code=400)
    return MessageResponse(detail="Code verified")


@router.post("/password-reset/confirm", response_model=MessageResponse)
@limiter.limit("5/hour")
async def reset_password_endpoint(
    request: Request,
    payload: PasswordResetConfirmRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await reset_password_confirm(
        db,
        redis_client,
        email=payload.email,
        code=payload.code,
        new_password=payload.new_password,
        request_meta={
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "request_id": getattr(request.state, "request_id", None),
        },
    )
    return MessageResponse(detail="Password has been reset")
