"""Compatibility rule schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import DepartmentEnum


class CompatibilityRuleBase(BaseModel):
    """Shared compatibility rule fields."""

    dept_a: DepartmentEnum
    activity_a: str = Field(..., max_length=100, examples=["Machine Tamping"])
    dept_b: DepartmentEnum
    activity_b: str = Field(..., max_length=100, examples=["OHE Wire Adjustment"])
    is_compatible: bool
    reason: Optional[str] = Field(None, max_length=500)


class CompatibilityRuleCreate(CompatibilityRuleBase):
    """Schema for creating a compatibility rule."""

    pass


class CompatibilityRuleResponse(CompatibilityRuleBase):
    """Compatibility rule response schema."""

    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
