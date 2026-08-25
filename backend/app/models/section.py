"""Railway section model — represents a block section between two stations."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import LineType


class Section(Base):
    """A railway block section (segment between two consecutive stations)."""

    __tablename__ = "sections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    section_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    section_name: Mapped[str] = mapped_column(String(200), nullable=False)
    division: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    zone: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    length_km: Mapped[float] = mapped_column(Float, nullable=False)
    line_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default=LineType.DOUBLE.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    maintenance_requests = relationship(
        "MaintenanceRequest", back_populates="section", cascade="all, delete-orphan"
    )
    train_movements = relationship(
        "TrainMovement", back_populates="section", cascade="all, delete-orphan"
    )
    blocks = relationship(
        "Block", back_populates="section", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Section {self.section_code}: {self.section_name}>"
