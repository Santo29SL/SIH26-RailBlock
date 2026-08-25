"""Train Movements API — CRUD endpoints for train movements through sections."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.train_movement import TrainMovement
from app.schemas.common import PaginatedResponse
from app.schemas.train_movement import (
    TrainMovementCreate,
    TrainMovementResponse,
    TrainMovementUpdate,
)
from app.services.crud import (
    calculate_total_pages,
    create_item,
    delete_item,
    get_item_by_id,
    get_items,
    update_item,
)

router = APIRouter(prefix="/train-movements", tags=["Train Movements"])


@router.post(
    "",
    response_model=TrainMovementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a train movement",
)
async def create_train_movement(
    payload: TrainMovementCreate, db: AsyncSession = Depends(get_db)
) -> TrainMovementResponse:
    """Add a train's scheduled movement through a section."""
    movement = await create_item(db, TrainMovement, payload.model_dump())
    return movement


@router.get(
    "",
    response_model=PaginatedResponse[TrainMovementResponse],
    summary="List train movements",
)
async def list_train_movements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    section_id: Optional[UUID] = Query(None),
    train_id: Optional[UUID] = Query(None),
    day_of_week: Optional[int] = Query(None, ge=0, le=6),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[TrainMovementResponse]:
    """List train movements with optional section, train, and day filtering."""
    filters = {
        "section_id": section_id,
        "train_id": train_id,
        "day_of_week": day_of_week,
    }
    items, total = await get_items(
        db, TrainMovement, page=page, page_size=page_size, filters=filters
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.get(
    "/{movement_id}",
    response_model=TrainMovementResponse,
    summary="Get train movement by ID",
)
async def get_train_movement(
    movement_id: UUID, db: AsyncSession = Depends(get_db)
) -> TrainMovementResponse:
    """Get a specific train movement by its UUID."""
    movement = await get_item_by_id(db, TrainMovement, movement_id)
    if not movement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Train movement not found."
        )
    return movement


@router.put(
    "/{movement_id}",
    response_model=TrainMovementResponse,
    summary="Update a train movement",
)
async def update_train_movement(
    movement_id: UUID,
    payload: TrainMovementUpdate,
    db: AsyncSession = Depends(get_db),
) -> TrainMovementResponse:
    """Update an existing train movement."""
    movement = await get_item_by_id(db, TrainMovement, movement_id)
    if not movement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Train movement not found."
        )
    updated = await update_item(db, movement, payload.model_dump(exclude_unset=True))
    return updated


@router.delete(
    "/{movement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a train movement",
)
async def delete_train_movement(
    movement_id: UUID, db: AsyncSession = Depends(get_db)
) -> Response:
    """Delete a train movement."""
    movement = await get_item_by_id(db, TrainMovement, movement_id)
    if not movement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Train movement not found."
        )
    await delete_item(db, movement)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
