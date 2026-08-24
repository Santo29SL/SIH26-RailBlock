"""Models package — imports all models so Alembic can auto-detect them."""

from app.models.section import Section
from app.models.train import Train
from app.models.train_movement import TrainMovement
from app.models.maintenance_request import MaintenanceRequest
from app.models.resource import Resource
from app.models.compatibility_rule import CompatibilityRule
from app.models.block import Block
from app.models.block_job import BlockJob

__all__ = [
    "Section",
    "Train",
    "TrainMovement",
    "MaintenanceRequest",
    "Resource",
    "CompatibilityRule",
    "Block",
    "BlockJob",
]
