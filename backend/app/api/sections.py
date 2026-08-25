"""Sections API — CRUD endpoints for railway sections."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.section import Section
from app.schemas.common import PaginatedResponse
from app.schemas.section import SectionCreate, SectionResponse, SectionUpdate
from app.services.crud import (
    calculate_total_pages,
    create_item,
    delete_item,
    get_item_by_field,
    get_item_by_id,
    get_items,
    update_item,
)

router = APIRouter(prefix="/sections", tags=["Sections"])


@router.post(
    "",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a railway section",
)
async def create_section(
    payload: SectionCreate, db: AsyncSession = Depends(get_db)
) -> SectionResponse:
    """Create a new railway section (block section between two stations)."""
    # Check uniqueness
    existing = await get_item_by_field(db, Section, "section_code", payload.section_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Section with code '{payload.section_code}' already exists.",
        )
    section = await create_item(db, Section, payload.model_dump())
    return section


@router.get(
    "",
    response_model=PaginatedResponse[SectionResponse],
    summary="List all sections",
)
async def list_sections(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    zone: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[SectionResponse]:
    """List all railway sections with optional zone/division filtering."""
    filters = {"zone": zone, "division": division}
    items, total = await get_items(
        db, Section, page=page, page_size=page_size, filters=filters
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.get(
    "/{section_id}",
    response_model=SectionResponse,
    summary="Get section by ID",
)
async def get_section(
    section_id: UUID, db: AsyncSession = Depends(get_db)
) -> SectionResponse:
    """Get a specific railway section by its UUID."""
    section = await get_item_by_id(db, Section, section_id)
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Section not found."
        )
    return section


@router.put(
    "/{section_id}",
    response_model=SectionResponse,
    summary="Update a section",
)
async def update_section(
    section_id: UUID,
    payload: SectionUpdate,
    db: AsyncSession = Depends(get_db),
) -> SectionResponse:
    """Update an existing railway section."""
    section = await get_item_by_id(db, Section, section_id)
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Section not found."
        )
    updated = await update_item(db, section, payload.model_dump(exclude_unset=True))
    return updated


@router.delete(
    "/{section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a section",
)
async def delete_section(
    section_id: UUID, db: AsyncSession = Depends(get_db)
) -> Response:
    """Delete a railway section and all associated data."""
    section = await get_item_by_id(db, Section, section_id)
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Section not found."
        )
    await delete_item(db, section)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
