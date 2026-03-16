from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=0, max_length=50000)

    @field_validator("title", "body")
    @classmethod
    def strip_and_validate(cls, value: str) -> str:
        return value.strip()


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    body: Optional[str] = Field(default=None, min_length=0, max_length=50000)


class NoteResponse(BaseModel):
    id: UUID
    title: str
    body: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
