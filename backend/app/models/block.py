"""Block model — a scheduled maintenance block on a railway section."""

from __future__ import annotations

import uuid
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Time, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Block(Base):
    """A scheduled maintenance block — a time window where a section is blocked."""

    __tablename__ = "blocks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    block_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sections.id", ondelete="CASCADE"),
        nullable=False,
    )
    block_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    train_impact_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    impact_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PROPOSED", index=True
    )
    optimizer_metadata: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    section = relationship("Section", back_populates="blocks")
    block_jobs = relationship(
        "BlockJob", back_populates="block", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Block {self.block_code}: {self.block_date} {self.start_time}-{self.end_time}>"
