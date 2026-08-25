"""Compatibility API — CRUD endpoints for maintenance compatibility rules."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.compatibility_rule import CompatibilityRule
from app.schemas.common import DepartmentEnum, PaginatedResponse
from app.schemas.compatibility_rule import (
    CompatibilityRuleCreate,
    CompatibilityRuleResponse,
)
from app.services.crud import (
    calculate_total_pages,
    create_item,
    delete_item,
    get_item_by_id,
    get_items,
)

router = APIRouter(prefix="/compatibility", tags=["Compatibility Rules"])


@router.post(
    "",
    response_model=CompatibilityRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a compatibility rule",
)
async def create_compatibility_rule(
    payload: CompatibilityRuleCreate, db: AsyncSession = Depends(get_db)
) -> CompatibilityRuleResponse:
    """Add a rule defining whether two maintenance activities can share a block."""
    rule = await create_item(db, CompatibilityRule, payload.model_dump())
    return rule


@router.get(
    "",
    response_model=PaginatedResponse[CompatibilityRuleResponse],
    summary="List compatibility rules",
)
async def list_compatibility_rules(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    dept_a: Optional[DepartmentEnum] = Query(None),
    dept_b: Optional[DepartmentEnum] = Query(None),
    is_compatible: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[CompatibilityRuleResponse]:
    """List compatibility rules with optional department/compatibility filtering."""
    filters = {
        "dept_a": dept_a.value if dept_a else None,
        "dept_b": dept_b.value if dept_b else None,
        "is_compatible": is_compatible,
    }
    items, total = await get_items(
        db, CompatibilityRule, page=page, page_size=page_size, filters=filters
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.delete(
    "/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a compatibility rule",
)
async def delete_compatibility_rule(
    rule_id: UUID, db: AsyncSession = Depends(get_db)
) -> Response:
    """Delete a compatibility rule."""
    rule = await get_item_by_id(db, CompatibilityRule, rule_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compatibility rule not found.",
        )
    await delete_item(db, rule)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
