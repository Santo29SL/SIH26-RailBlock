"""Authentication and Role-Based Access Control (RBAC) dependencies."""

from __future__ import annotations

from typing import List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login", auto_error=False
)


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Retrieve current user from JWT token if present, returns None if anonymous."""
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    username = payload["sub"]
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        return None

    return user


async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Enforce authenticated user requirement."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


class RequireRole:
    """Dependency checker for Role-Based Access Control (RBAC)."""

    def __init__(self, allowed_roles: List[str | UserRole]):
        self.allowed_roles = [
            r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles
        ]

    async def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles and current_user.role != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' is not authorized. Allowed: {self.allowed_roles}",
            )
        return current_user


# Permission stub per Railway Board letter dated 16.06.2022 (DRM ≤ 4 hr; GM sanction for NI ≤ 3 days)
require_divisional_authority = RequireRole([UserRole.ADMIN, UserRole.DIVISIONAL_AUTHORITY])
"""Approval of traffic blocks > 4 hours and NI works > 3 days, per Railway Board letter dated 16.06.2022 (DRM ≤ 4 hr; GM sanction for NI ≤ 3 days)."""
