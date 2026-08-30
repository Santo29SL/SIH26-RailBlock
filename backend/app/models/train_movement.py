"""Train movement model — represents a train's passage through a section."""

from __future__ import annotations

import uuid
from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TrainMovement(Base):
    """A train's scheduled movement through a specific section on a given day."""

    __tablename__ = "train_movements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    train_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trains.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sections.id", ondelete="CASCADE"),
        nullable=False,
    )
    departure_time: Mapped[time] = mapped_column(Time, nullable=False)
    arrival_time: Mapped[time] = mapped_column(Time, nullable=False)
    day_of_week: Mapped[int] = mapped_column(
        Integer, nullable=False, index=True
    )  # 0=Monday, 6=Sunday
    movement_type: Mapped[str] = mapped_column(
        String(30), default="SCHEDULED", server_default="SCHEDULED", nullable=False
    )  # SCHEDULED or FORECAST_FREIGHT
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    train = relationship("Train", back_populates="movements")
    section = relationship("Section", back_populates="train_movements")

    def __repr__(self) -> str:
        return f"<TrainMovement train={self.train_id} section={self.section_id} day={self.day_of_week}>"
