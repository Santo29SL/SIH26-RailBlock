"""Main API router — aggregates all endpoint routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.sections import router as sections_router
from app.api.maintenance import router as maintenance_router
from app.api.trains import router as trains_router
from app.api.train_movements import router as train_movements_router
from app.api.resources import router as resources_router
from app.api.compatibility import router as compatibility_router
from app.api.blocks import router as blocks_router
from app.api.optimizer import router as optimizer_router

api_router = APIRouter()

api_router.include_router(sections_router)
api_router.include_router(maintenance_router)
api_router.include_router(trains_router)
api_router.include_router(train_movements_router)
api_router.include_router(resources_router)
api_router.include_router(compatibility_router)
api_router.include_router(blocks_router)
api_router.include_router(optimizer_router)

