"""Schemas package."""

from app.schemas.common import (
    BlockStatusEnum,
    DepartmentEnum,
    LineTypeEnum,
    MaintenanceStatusEnum,
    MessageResponse,
    PaginatedResponse,
    PriorityEnum,
    TrainPriorityEnum,
    TrainTypeEnum,
)
from app.schemas.section import SectionCreate, SectionResponse, SectionUpdate
from app.schemas.maintenance_request import (
    MaintenanceRequestCreate,
    MaintenanceRequestResponse,
    MaintenanceRequestUpdate,
)
from app.schemas.train import TrainCreate, TrainResponse, TrainUpdate
from app.schemas.train_movement import (
    TrainMovementCreate,
    TrainMovementResponse,
    TrainMovementUpdate,
)
from app.schemas.resource import ResourceCreate, ResourceResponse, ResourceUpdate
from app.schemas.compatibility_rule import (
    CompatibilityRuleCreate,
    CompatibilityRuleResponse,
)
from app.schemas.block import BlockResponse, BlockDetailResponse
