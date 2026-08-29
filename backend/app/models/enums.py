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
    CANCELLED = "CANCELLED"


class LineType(str, enum.Enum):
    """Type of railway line."""

    SINGLE = "SINGLE"
    DOUBLE = "DOUBLE"
    TRIPLE = "TRIPLE"
    QUADRUPLE = "QUADRUPLE"


class USFDClassification(str, enum.Enum):
    """Ultrasonic Flaw Detection (USFD) rail flaw classifications per IRPWM."""

    GOOD = "GOOD"
    IMR = "IMR"      # Immediate Removal (T1 flaw)
    IMRW = "IMRW"    # Immediate Removal Weld (T1 flaw)
    OBS = "OBS"      # Observed (T2 flaw)
    OBSW = "OBSW"    # Observed Weld (T2 flaw)


class UserRole(str, enum.Enum):
    """User roles for RailBlock RBAC (4+1 Tier)."""

    ADMIN = "ADMIN"
    SECTION_CONTROLLER = "SECTION_CONTROLLER"
    STATION_MASTER = "STATION_MASTER"
    DEPARTMENT_ENGINEER = "DEPARTMENT_ENGINEER"
    DIVISIONAL_AUTHORITY = "DIVISIONAL_AUTHORITY"
    """Approval of traffic blocks > 4 hours and NI works > 3 days, per Railway Board letter dated 16.06.2022 (DRM ≤ 4 hr; GM sanction for NI ≤ 3 days)."""


RoleEnum = UserRole
