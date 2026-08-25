"""Train schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import TrainPriorityEnum, TrainTypeEnum


class TrainBase(BaseModel):
    """Shared train fields."""

    train_number: str = Field(..., max_length=10, examples=["12621"])
    train_name: str = Field(
        ..., max_length=200, examples=["Tamil Nadu Express"]
    )
    train_type: TrainTypeEnum
    priority: TrainPriorityEnum = Field(default=TrainPriorityEnum.MEDIUM)


class TrainCreate(TrainBase):
    """Schema for creating a train."""

    pass


class TrainUpdate(BaseModel):
    """Schema for updating a train (all fields optional)."""

    train_name: Optional[str] = Field(None, max_length=200)
    train_type: Optional[TrainTypeEnum] = None
    priority: Optional[TrainPriorityEnum] = None


class TrainResponse(TrainBase):
    """Train response schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
