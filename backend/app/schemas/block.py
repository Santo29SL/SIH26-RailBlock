"""Block schemas (read-only in Phase 1)."""

from __future__ import annotations

from datetime import date, datetime, time
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import BlockStatusEnum


class BlockJobResponse(BaseModel):
    """Block job (association) response."""

    id: UUID
    maintenance_request_id: UUID
    sequence_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class BlockResponse(BaseModel):
    """Block summary response."""

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

    class Config:
        from_attributes = True


class BlockDetailResponse(BlockResponse):
    """Block detail response with associated jobs."""

    optimizer_metadata: Optional[Dict[str, Any]] = None
    block_jobs: List[BlockJobResponse] = []
