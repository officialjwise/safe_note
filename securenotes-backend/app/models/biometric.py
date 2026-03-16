"""Biometric auth ORM model"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class BiometricAuth(Base):
    """Biometric authentication enrollment for users"""

    __tablename__ = "biometric_auth"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    device_id: Mapped[str] = mapped_column(String(255), nullable=False)
    biometric_type: Mapped[str] = mapped_column(String(50), nullable=False)  # fingerprint, face, iris
    enrolled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_used: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="biometric_auths")

    __table_args__ = (
        Index("ix_biometric_auth_user_device", "user_id", "device_id"),
    )
