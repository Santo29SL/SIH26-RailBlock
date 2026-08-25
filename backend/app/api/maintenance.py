"""Maintenance API — CRUD endpoints for maintenance requests."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.maintenance_request import MaintenanceRequest
from app.schemas.common import DepartmentEnum, MaintenanceStatusEnum, PaginatedResponse, PriorityEnum
from app.schemas.maintenance_request import (
    MaintenanceRequestCreate,
    MaintenanceRequestResponse,
    MaintenanceRequestUpdate,
)
from app.services.crud import (
    calculate_total_pages,
    create_item,
    delete_item,
    get_item_by_field,
    get_item_by_id,
    get_items,
    update_item,
)

router = APIRouter(prefix="/maintenance", tags=["Maintenance Requests"])


@router.post(
    "",
    response_model=MaintenanceRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a maintenance request",
)
async def create_maintenance_request(
    payload: MaintenanceRequestCreate, db: AsyncSession = Depends(get_db)
) -> MaintenanceRequestResponse:
    """Create a new maintenance request for a railway section."""
    existing = await get_item_by_field(
        db, MaintenanceRequest, "request_code", payload.request_code
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Request with code '{payload.request_code}' already exists.",
        )
    request = await create_item(db, MaintenanceRequest, payload.model_dump())
    return request


@router.get(
    "",
    response_model=PaginatedResponse[MaintenanceRequestResponse],
    summary="List maintenance requests",
)
async def list_maintenance_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    section_id: Optional[UUID] = Query(None),
    department: Optional[DepartmentEnum] = Query(None),
    status_filter: Optional[MaintenanceStatusEnum] = Query(None, alias="status"),
    priority: Optional[PriorityEnum] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[MaintenanceRequestResponse]:
    """List maintenance requests with optional filtering by section, department, status, priority."""
    filters = {
        "section_id": section_id,
        "department": department.value if department else None,
        "status": status_filter.value if status_filter else None,
        "priority": priority.value if priority else None,
    }
    items, total = await get_items(
        db, MaintenanceRequest, page=page, page_size=page_size, filters=filters
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.get(
    "/{request_id}",
    response_model=MaintenanceRequestResponse,
    summary="Get maintenance request by ID",
)
async def get_maintenance_request(
    request_id: UUID, db: AsyncSession = Depends(get_db)
) -> MaintenanceRequestResponse:
    """Get a specific maintenance request by its UUID."""
    request = await get_item_by_id(db, MaintenanceRequest, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found.",
        )
    return request


@router.put(
    "/{request_id}",
    response_model=MaintenanceRequestResponse,
    summary="Update a maintenance request",
)
async def update_maintenance_request(
    request_id: UUID,
    payload: MaintenanceRequestUpdate,
    db: AsyncSession = Depends(get_db),
) -> MaintenanceRequestResponse:
    """Update an existing maintenance request."""
    request = await get_item_by_id(db, MaintenanceRequest, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found.",
        )
    updated = await update_item(db, request, payload.model_dump(exclude_unset=True))
    return updated


@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a maintenance request",
)
async def delete_maintenance_request(
    request_id: UUID, db: AsyncSession = Depends(get_db)
) -> Response:
    """Delete a maintenance request."""
    request = await get_item_by_id(db, MaintenanceRequest, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found.",
        )
    await delete_item(db, request)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
