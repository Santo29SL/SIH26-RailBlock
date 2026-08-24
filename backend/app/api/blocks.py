"""Blocks API — Read-only endpoints for maintenance blocks (Phase 1)."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_db
from app.models.block import Block
from app.schemas.block import BlockDetailResponse, BlockResponse
from app.schemas.common import BlockStatusEnum, PaginatedResponse
from app.services.crud import calculate_total_pages, get_items

router = APIRouter(prefix="/blocks", tags=["Blocks"])


@router.get(
    "",
    response_model=PaginatedResponse[BlockResponse],
    summary="List blocks",
)
async def list_blocks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    section_id: Optional[UUID] = Query(None),
    status_filter: Optional[BlockStatusEnum] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[BlockResponse]:
    """List maintenance blocks with optional section/status filtering."""
    filters = {
        "section_id": section_id,
        "status": status_filter.value if status_filter else None,
    }
    items, total = await get_items(
        db, Block, page=page, page_size=page_size, filters=filters
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.get(
    "/{block_id}",
    response_model=BlockDetailResponse,
    summary="Get block details with jobs",
)
async def get_block_detail(
    block_id: UUID, db: AsyncSession = Depends(get_db)
) -> BlockDetailResponse:
    """Get detailed information about a block including its associated jobs."""
    result = await db.execute(
        select(Block)
        .where(Block.id == block_id)
        .options(selectinload(Block.block_jobs))
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Block not found."
        )
    return block
