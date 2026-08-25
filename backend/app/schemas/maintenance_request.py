"""Maintenance request schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import DepartmentEnum, MaintenanceStatusEnum, PriorityEnum


class MaintenanceRequestBase(BaseModel):
    """Shared maintenance request fields."""

    request_code: str = Field(..., max_length=20, examples=["MR-TRK-001"])
    section_id: UUID
    department: DepartmentEnum
    activity_type: str = Field(..., max_length=100, examples=["Machine Tamping"])
    duration_minutes: int = Field(..., gt=0, le=480, examples=[120])
    priority: PriorityEnum = Field(default=PriorityEnum.MEDIUM)
    deadline: date
    resource_id: Optional[UUID] = None
    metadata_json: Optional[Dict[str, Any]] = None


class MaintenanceRequestCreate(MaintenanceRequestBase):
    """Schema for creating a maintenance request."""

    status: MaintenanceStatusEnum = Field(default=MaintenanceStatusEnum.PENDING)


class MaintenanceRequestUpdate(BaseModel):
    """Schema for updating a maintenance request (all fields optional)."""

    activity_type: Optional[str] = Field(None, max_length=100)
    duration_minutes: Optional[int] = Field(None, gt=0, le=480)
    priority: Optional[PriorityEnum] = None
    deadline: Optional[date] = None
    status: Optional[MaintenanceStatusEnum] = None
    resource_id: Optional[UUID] = None
    metadata_json: Optional[Dict[str, Any]] = None


class MaintenanceRequestResponse(MaintenanceRequestBase):
    """Maintenance request response schema."""

    id: UUID
    status: MaintenanceStatusEnum
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
