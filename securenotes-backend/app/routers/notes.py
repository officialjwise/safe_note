from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limiter import limiter
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.services.note_service import (
    create_note,
    delete_note,
    get_all_notes,
    get_note,
    search_notes,
    update_note,
)

router = APIRouter(prefix="/notes")


@router.get("", response_model=list[NoteResponse])
@limiter.limit("60/minute")
async def list_notes(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[NoteResponse]:
    return await get_all_notes(db, current_user.id)


@router.post("", response_model=NoteResponse)
@limiter.limit("30/minute")
async def create_note_endpoint(
    request: Request,
    payload: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NoteResponse:
    return await create_note(db, current_user.id, payload)


@router.get("/search", response_model=list[NoteResponse])
@limiter.limit("30/minute")
async def search_notes_endpoint(
    request: Request,
    q: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[NoteResponse]:
    return await search_notes(db, current_user.id, q)


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note_endpoint(
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NoteResponse:
    return await get_note(db, note_id, current_user.id)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note_endpoint(
    note_id: UUID,
    payload: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NoteResponse:
    return await update_note(db, note_id, current_user.id, payload)


@router.delete("/{note_id}", response_model=MessageResponse)
async def delete_note_endpoint(
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    await delete_note(db, note_id, current_user.id)
    return MessageResponse(detail="Note deleted")
