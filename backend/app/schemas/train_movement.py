"""Train movement schemas."""

from __future__ import annotations

from datetime import datetime, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator


class TrainMovementBase(BaseModel):
    """Shared train movement fields."""

    train_id: UUID
    section_id: UUID
    departure_time: time
    arrival_time: time
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    is_active: bool = Field(default=True)


class TrainMovementCreate(TrainMovementBase):
    """Schema for creating a train movement."""

    pass


class TrainMovementUpdate(BaseModel):
    """Schema for updating a train movement (all fields optional)."""

    departure_time: Optional[time] = None
    arrival_time: Optional[time] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    is_active: Optional[bool] = None


class TrainMovementResponse(TrainMovementBase):
    """Train movement response schema."""

    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
