"""User model for authentication and Role-Based Access Control (RBAC)."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User roles for RailBlock authorization (4+1 Tier RBAC)."""

    ADMIN = "ADMIN"
    SECTION_CONTROLLER = "SECTION_CONTROLLER"
    STATION_MASTER = "STATION_MASTER"
    DEPARTMENT_ENGINEER = "DEPARTMENT_ENGINEER"
    DIVISIONAL_AUTHORITY = "DIVISIONAL_AUTHORITY"


RoleEnum = UserRole


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(30), nullable=False, default=UserRole.SECTION_CONTROLLER.value, index=True
    )
    department: Mapped[str] = mapped_column(
        String(30), nullable=True
    )  # TRACK, SIGNAL, TRACTION, OPERATIONS
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<User {self.username} [{self.role}]>"
