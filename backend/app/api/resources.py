"""Resources API — CRUD endpoints for maintenance resources."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.resource import Resource
from app.schemas.common import DepartmentEnum, PaginatedResponse
from app.schemas.resource import ResourceCreate, ResourceResponse, ResourceUpdate
from app.services.crud import (
    calculate_total_pages,
    create_item,
    delete_item,
    get_item_by_id,
    get_items,
    update_item,
)

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.post(
    "",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a resource",
)
async def create_resource(
    payload: ResourceCreate, db: AsyncSession = Depends(get_db)
) -> ResourceResponse:
    """Create a new maintenance resource (crew/machine/equipment)."""
    resource = await create_item(db, Resource, payload.model_dump())
    return resource


@router.get(
    "",
    response_model=PaginatedResponse[ResourceResponse],
    summary="List resources",
)
async def list_resources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    department: Optional[DepartmentEnum] = Query(None),
    is_available: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ResourceResponse]:
    """List maintenance resources with optional department/availability filtering."""
    filters = {
        "department": department.value if department else None,
        "is_available": is_available,
    }
    items, total = await get_items(
        db, Resource, page=page, page_size=page_size, filters=filters
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.get(
    "/{resource_id}",
    response_model=ResourceResponse,
    summary="Get resource by ID",
)
async def get_resource(
    resource_id: UUID, db: AsyncSession = Depends(get_db)
) -> ResourceResponse:
    """Get a specific resource by its UUID."""
    resource = await get_item_by_id(db, Resource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found."
        )
    return resource


@router.put(
    "/{resource_id}",
    response_model=ResourceResponse,
    summary="Update a resource",
)
async def update_resource(
    resource_id: UUID,
    payload: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
) -> ResourceResponse:
    """Update an existing resource."""
    resource = await get_item_by_id(db, Resource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found."
        )
    updated = await update_item(db, resource, payload.model_dump(exclude_unset=True))
    return updated


@router.delete(
    "/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a resource",
)
async def delete_resource(
    resource_id: UUID, db: AsyncSession = Depends(get_db)
) -> Response:
    """Delete a resource."""
    resource = await get_item_by_id(db, Resource, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found."
        )
    await delete_item(db, resource)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
