"""Train model — represents a train service on Indian Railways."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Train(Base):
    """A train service identified by its number."""

    __tablename__ = "trains"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    train_number: Mapped[str] = mapped_column(
        String(10), unique=True, nullable=False, index=True
    )
    train_name: Mapped[str] = mapped_column(String(200), nullable=False)
    train_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="MEDIUM")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    movements = relationship(
        "TrainMovement", back_populates="train", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Train {self.train_number}: {self.train_name}>"
