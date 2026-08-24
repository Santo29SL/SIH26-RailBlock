"""Generic async CRUD service helpers."""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Sequence, Tuple, Type, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


async def create_item(
    db: AsyncSession, model: Type[ModelType], data: Dict[str, Any]
) -> ModelType:
    """Create a new item in the database."""
    item = model(**data)
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def get_item_by_id(
    db: AsyncSession, model: Type[ModelType], item_id: UUID
) -> Optional[ModelType]:
    """Get a single item by its UUID."""
    result = await db.execute(select(model).where(model.id == item_id))
    return result.scalar_one_or_none()


async def get_item_by_field(
    db: AsyncSession, model: Type[ModelType], field_name: str, value: Any
) -> Optional[ModelType]:
    """Get a single item by a specific field value."""
    column = getattr(model, field_name)
    result = await db.execute(select(model).where(column == value))
    return result.scalar_one_or_none()


async def get_items(
    db: AsyncSession,
    model: Type[ModelType],
    *,
    page: int = 1,
    page_size: int = 20,
    filters: Optional[Dict[str, Any]] = None,
    order_by: Optional[str] = None,
    order_desc: bool = False,
) -> Tuple[Sequence[ModelType], int]:
    """
    Get paginated list of items with optional filtering.

    Returns (items, total_count).
    """
    query = select(model)
    count_query = select(func.count()).select_from(model)

    # Apply filters
    if filters:
        for field_name, value in filters.items():
            if value is not None and hasattr(model, field_name):
                column = getattr(model, field_name)
                query = query.where(column == value)
                count_query = count_query.where(column == value)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply ordering
    if order_by and hasattr(model, order_by):
        column = getattr(model, order_by)
        query = query.order_by(column.desc() if order_desc else column.asc())
    elif hasattr(model, "created_at"):
        query = query.order_by(model.created_at.desc())

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    items = result.scalars().all()

    return items, total


async def update_item(
    db: AsyncSession,
    item: ModelType,
    data: Dict[str, Any],
) -> ModelType:
    """Update an existing item with partial data."""
    for field, value in data.items():
        if value is not None:
            setattr(item, field, value)
    await db.flush()
    await db.refresh(item)
    return item


async def delete_item(db: AsyncSession, item: ModelType) -> None:
    """Delete an item from the database."""
    await db.delete(item)
    await db.flush()


def calculate_total_pages(total: int, page_size: int) -> int:
    """Calculate total pages for pagination."""
    return max(1, math.ceil(total / page_size))
