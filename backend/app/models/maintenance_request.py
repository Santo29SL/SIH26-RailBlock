"""Maintenance request model — a request for maintenance work on a section."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MaintenanceRequest(Base):
    """A maintenance work request from Track, Signal, or Traction department."""

    __tablename__ = "maintenance_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    request_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sections.id", ondelete="CASCADE"),
        nullable=False,
    )
    department: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # TRACK | SIGNAL | TRACTION
    activity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    priority: Mapped[str] = mapped_column(
        String(10), nullable=False, default="MEDIUM", index=True
    )
    deadline: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING", index=True
    )
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id"), nullable=True
    )
    metadata_json: Mapped[dict] = mapped_column(
        "metadata", JSON, nullable=True, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    section = relationship("Section", back_populates="maintenance_requests")
    resource = relationship("Resource", back_populates="maintenance_requests")
    block_jobs = relationship(
        "BlockJob", back_populates="maintenance_request", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<MaintenanceRequest {self.request_code}: {self.department}/{self.activity_type}>"
