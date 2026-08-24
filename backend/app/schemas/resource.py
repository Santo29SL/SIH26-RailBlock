"""Resource schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import DepartmentEnum


class ResourceBase(BaseModel):
    """Shared resource fields."""

    resource_name: str = Field(..., max_length=200, examples=["Tamping Machine Unit 1"])
    department: DepartmentEnum
    capacity: int = Field(default=1, ge=1)
    is_available: bool = Field(default=True)


class ResourceCreate(ResourceBase):
    """Schema for creating a resource."""

    pass


class ResourceUpdate(BaseModel):
    """Schema for updating a resource (all fields optional)."""

    resource_name: Optional[str] = Field(None, max_length=200)
    capacity: Optional[int] = Field(None, ge=1)
    is_available: Optional[bool] = None


class ResourceResponse(ResourceBase):
    """Resource response schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
