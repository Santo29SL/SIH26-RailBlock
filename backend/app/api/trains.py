"""Trains API — CRUD endpoints for trains."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.train import Train
from app.schemas.common import PaginatedResponse, TrainTypeEnum
from app.schemas.train import TrainCreate, TrainResponse, TrainUpdate
from app.services.crud import (
    calculate_total_pages,
    create_item,
    delete_item,
    get_item_by_field,
    get_item_by_id,
    get_items,
    update_item,
)

router = APIRouter(prefix="/trains", tags=["Trains"])


@router.post(
    "",
    response_model=TrainResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a train",
)
async def create_train(
    payload: TrainCreate, db: AsyncSession = Depends(get_db)
) -> TrainResponse:
    """Register a new train service."""
    existing = await get_item_by_field(db, Train, "train_number", payload.train_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Train '{payload.train_number}' already exists.",
        )
    train = await create_item(db, Train, payload.model_dump())
    return train


@router.get(
    "",
    response_model=PaginatedResponse[TrainResponse],
    summary="List trains",
)
async def list_trains(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    train_type: Optional[TrainTypeEnum] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[TrainResponse]:
    """List all registered trains with optional type filtering."""
    filters = {
        "train_type": train_type.value if train_type else None,
    }
    items, total = await get_items(
        db, Train, page=page, page_size=page_size, filters=filters
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.get(
    "/{train_id}",
    response_model=TrainResponse,
    summary="Get train by ID",
)
async def get_train(
    train_id: UUID, db: AsyncSession = Depends(get_db)
) -> TrainResponse:
    """Get a specific train by its UUID."""
    train = await get_item_by_id(db, Train, train_id)
    if not train:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Train not found."
        )
    return train


@router.put(
    "/{train_id}",
    response_model=TrainResponse,
    summary="Update a train",
)
async def update_train(
    train_id: UUID,
    payload: TrainUpdate,
    db: AsyncSession = Depends(get_db),
) -> TrainResponse:
    """Update an existing train."""
    train = await get_item_by_id(db, Train, train_id)
    if not train:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Train not found."
        )
    updated = await update_item(db, train, payload.model_dump(exclude_unset=True))
    return updated


@router.delete(
    "/{train_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a train",
)
async def delete_train(
    train_id: UUID, db: AsyncSession = Depends(get_db)
) -> Response:
    """Delete a train and all associated movements."""
    train = await get_item_by_id(db, Train, train_id)
    if not train:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Train not found."
        )
    await delete_item(db, train)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
