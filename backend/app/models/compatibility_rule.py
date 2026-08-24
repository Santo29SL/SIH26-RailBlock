"""Compatibility rule model — defines which maintenance activities can run together."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CompatibilityRule(Base):
    """A rule defining whether two maintenance activities are compatible in the same block."""

    __tablename__ = "compatibility_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dept_a: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # TRACK | SIGNAL | TRACTION
    activity_a: Mapped[str] = mapped_column(String(100), nullable=False)
    dept_b: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # TRACK | SIGNAL | TRACTION
    activity_b: Mapped[str] = mapped_column(String(100), nullable=False)
    is_compatible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        compat = "✓" if self.is_compatible else "✗"
        return f"<CompatibilityRule {self.dept_a}/{self.activity_a} {compat} {self.dept_b}/{self.activity_b}>"
