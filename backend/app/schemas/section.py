"""Section schemas for request/response validation."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import LineTypeEnum


class SectionBase(BaseModel):
    """Shared section fields."""

    section_code: str = Field(..., max_length=20, examples=["MAS-AJJ"])
    section_name: str = Field(
        ..., max_length=200, examples=["Chennai Central - Arakkonam"]
    )
    division: str = Field(..., max_length=100, examples=["Chennai"])
    zone: str = Field(..., max_length=100, examples=["Southern Railway"])
    length_km: float = Field(..., gt=0, examples=[80.5])
    line_type: LineTypeEnum = Field(default=LineTypeEnum.DOUBLE)


class SectionCreate(SectionBase):
    """Schema for creating a new section."""

    pass


class SectionUpdate(BaseModel):
    """Schema for updating a section (all fields optional)."""

    section_name: Optional[str] = Field(None, max_length=200)
    division: Optional[str] = Field(None, max_length=100)
    zone: Optional[str] = Field(None, max_length=100)
    length_km: Optional[float] = Field(None, gt=0)
    line_type: Optional[LineTypeEnum] = None


class SectionResponse(SectionBase):
    """Section response schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
