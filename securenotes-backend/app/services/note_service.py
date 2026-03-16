from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.services.encryption_service import decrypt, encrypt


def _to_response(note: Note, user_id: UUID) -> NoteResponse:
    return NoteResponse(
        id=note.id,
        title=decrypt(note.title_encrypted, user_id),
        body=decrypt(note.body_encrypted, user_id),
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


def _forbidden() -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


async def get_all_notes(db: AsyncSession, user_id: UUID) -> list[NoteResponse]:
    result = await db.execute(select(Note).where(Note.user_id == user_id).order_by(Note.updated_at.desc()))
    notes = result.scalars().all()
    return [_to_response(note, user_id) for note in notes]


async def create_note(db: AsyncSession, user_id: UUID, data: NoteCreate) -> NoteResponse:
    note = Note(
        user_id=user_id,
        title_encrypted=encrypt(data.title, user_id),
        body_encrypted=encrypt(data.body, user_id),
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return _to_response(note, user_id)


async def get_note(db: AsyncSession, note_id: UUID, user_id: UUID) -> NoteResponse:
    note = await db.get(Note, note_id)
    if note is None or note.user_id != user_id:
        raise _forbidden()
    return _to_response(note, user_id)


async def update_note(db: AsyncSession, note_id: UUID, user_id: UUID, data: NoteUpdate) -> NoteResponse:
    note = await db.get(Note, note_id)
    if note is None or note.user_id != user_id:
        raise _forbidden()

    if data.title is not None:
        note.title_encrypted = encrypt(data.title.strip(), user_id)
    if data.body is not None:
        note.body_encrypted = encrypt(data.body.strip(), user_id)

    await db.commit()
    await db.refresh(note)
    return _to_response(note, user_id)


async def delete_note(db: AsyncSession, note_id: UUID, user_id: UUID) -> None:
    note = await db.get(Note, note_id)
    if note is None or note.user_id != user_id:
        raise _forbidden()
    await db.delete(note)
    await db.commit()


async def search_notes(db: AsyncSession, user_id: UUID, query: str) -> list[NoteResponse]:
    normalized = query.strip()[:200].lower()
    if not normalized:
        return await get_all_notes(db, user_id)

    notes = await get_all_notes(db, user_id)
    return [
        note for note in notes if normalized in note.title.lower() or normalized in note.body.lower()
    ]
