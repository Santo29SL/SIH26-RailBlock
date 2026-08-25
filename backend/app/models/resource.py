"""Resource model — maintenance equipment/crew resources."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Resource(Base):
    """A maintenance resource (crew, machine, equipment) belonging to a department."""

    __tablename__ = "resources"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    resource_name: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # TRACK | SIGNAL | TRACTION
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    maintenance_requests = relationship(
        "MaintenanceRequest", back_populates="resource"
    )

    def __repr__(self) -> str:
        return f"<Resource {self.resource_name} ({self.department})>"
