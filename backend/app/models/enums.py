"""Shared enums used across models."""

from __future__ import annotations

import enum


class Department(str, enum.Enum):
    """Railway maintenance departments."""

    TRACK = "TRACK"
    SIGNAL = "SIGNAL"
    TRACTION = "TRACTION"


class Priority(str, enum.Enum):
    """Priority levels for maintenance requests and trains."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TrainType(str, enum.Enum):
    """Types of trains in Indian Railways."""

    EXPRESS = "EXPRESS"
    SUPERFAST = "SUPERFAST"
    MAIL = "MAIL"
    LOCAL = "LOCAL"
    FREIGHT = "FREIGHT"


class TrainPriority(str, enum.Enum):
    """Priority levels for trains (separate from maintenance priority)."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class MaintenanceStatus(str, enum.Enum):
    """Status of a maintenance request."""

    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class BlockStatus(str, enum.Enum):
    """Status of a maintenance block."""

    PROPOSED = "PROPOSED"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class LineType(str, enum.Enum):
    """Type of railway line."""

    SINGLE = "SINGLE"
    DOUBLE = "DOUBLE"
    TRIPLE = "TRIPLE"
    QUADRUPLE = "QUADRUPLE"
