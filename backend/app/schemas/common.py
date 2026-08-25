"""Common schemas — shared enums, pagination, and base response models."""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel


# ── Enums (mirror of model enums for API layer) ──────

class DepartmentEnum(str, enum.Enum):
    TRACK = "TRACK"
    SIGNAL = "SIGNAL"
    TRACTION = "TRACTION"


class PriorityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TrainTypeEnum(str, enum.Enum):
    EXPRESS = "EXPRESS"
    SUPERFAST = "SUPERFAST"
    MAIL = "MAIL"
    LOCAL = "LOCAL"
    FREIGHT = "FREIGHT"


class TrainPriorityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class MaintenanceStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class BlockStatusEnum(str, enum.Enum):
    PROPOSED = "PROPOSED"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class LineTypeEnum(str, enum.Enum):
    SINGLE = "SINGLE"
    DOUBLE = "DOUBLE"
    TRIPLE = "TRIPLE"
    QUADRUPLE = "QUADRUPLE"


# ── Pagination ───────────────────────────────────────

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response wrapper."""

    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Common Response ──────────────────────────────────

class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
    detail: Optional[str] = None
