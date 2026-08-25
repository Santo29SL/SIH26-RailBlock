"""Block-Job association model — links maintenance requests to blocks."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BlockJob(Base):
    """Associates a maintenance request (job) with a block, with sequencing."""

    __tablename__ = "block_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    block_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("blocks.id", ondelete="CASCADE"),
        nullable=False,
    )
    maintenance_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("maintenance_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    block = relationship("Block", back_populates="block_jobs")
    maintenance_request = relationship(
        "MaintenanceRequest", back_populates="block_jobs"
    )

    def __repr__(self) -> str:
        return f"<BlockJob block={self.block_id} request={self.maintenance_request_id} seq={self.sequence_order}>"
