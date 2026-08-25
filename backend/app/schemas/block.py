"""Block schemas (read-only in Phase 1)."""

from __future__ import annotations

from datetime import date, datetime, time
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import BlockStatusEnum


class BlockJobResponse(BaseModel):
    """Block job (association) response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    maintenance_request_id: UUID
    sequence_order: int
    created_at: datetime


class BlockResponse(BaseModel):
    """Block summary response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    block_code: str
    section_id: UUID
    block_date: date
    start_time: time
    end_time: time
    duration_minutes: int
    train_impact_count: int
    impact_score: float
    status: BlockStatusEnum
    created_at: datetime
    updated_at: datetime


class BlockDetailResponse(BlockResponse):
    """Block detail response with associated jobs."""

    model_config = ConfigDict(from_attributes=True)

    optimizer_metadata: Optional[Dict[str, Any]] = None
    block_jobs: List[BlockJobResponse] = []


class BlockTransitionRequest(BaseModel):
    """Request payload to transition block status according to G&SR and Form T/351 rules."""

    model_config = ConfigDict(from_attributes=True)

    target_status: BlockStatusEnum = Field(
        ...,
        description="Target status: APPROVED, ACTIVE, COMPLETED, CANCELLED",
        examples=[BlockStatusEnum.APPROVED],
    )
    private_number: Optional[str] = Field(
        None,
        description="Station Master Private Number (PN) required for ACTIVE / COMPLETED transitions",
        examples=["PN-4821"],
    )
    disconnection_private_number: Optional[str] = Field(
        None,
        description="Disconnection Station Master Private Number (PN) for ACTIVE transition",
        examples=["PN-4821"],
    )
    reconnection_private_number: Optional[str] = Field(
        None,
        description="Reconnection Station Master Private Number (PN) for COMPLETED transition",
        examples=["PN-4899"],
    )
    station_master_name: Optional[str] = Field(None, examples=["R. K. Sharma"])
    field_engineer_name: Optional[str] = Field(None, examples=["P. V. Nair"])
    field_engineer_designation: Optional[str] = Field(
        None, examples=["SSE/Permanent Way/MAS"]
    )
    disconnection_time: Optional[time] = None
    reconnection_time: Optional[time] = None
    tsr_imposed: Optional[bool] = Field(
        default=None,
        description="Whether Temporary Speed Restriction is imposed upon reconnection",
    )
    tsr_speed_kmph: Optional[int] = Field(
        default=None,
        description="Caution order restricted velocity in km/h under TSR",
        examples=[45],
    )
    approved_by: Optional[str] = Field(
        None,
        description="Name or designation of official authorizing/approving the block",
        examples=["Sr. DOM/Chennai"],
    )
    remarks: Optional[str] = Field(
        None, max_length=500, description="Operational remarks or transition notes"
    )

