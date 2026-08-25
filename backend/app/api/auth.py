"""Authentication & User Management API Endpoints."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.permissions import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])


class TokenResponse(BaseModel):
    """JWT Token authentication response."""

    access_token: str = Field(..., description="Signed JWT Bearer Access Token")
    token_type: str = Field("bearer", description="Token type")
    role: str = Field(..., description="User role")
    username: str = Field(..., description="Authenticated username")


class UserResponse(BaseModel):
    """User account summary."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    role: str
    department: Optional[str] = None
    is_active: bool


class UserCreateRequest(BaseModel):
    """User registration payload."""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.SECTION_CONTROLLER
    department: Optional[str] = None


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and acquire JWT Access Token",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate user credentials and issue signed JWT access token."""
    stmt = select(User).where(
        (User.username == form_data.username) | (User.email == form_data.username)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account"
        )

    access_token = create_access_token(
        subject=user.username,
        role=user.role,
        additional_claims={"user_id": str(user.id), "email": user.email},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        username=user.username,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return user details for authenticated identity."""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        department=current_user.department,
        is_active=current_user.is_active,
    )


@router.post(
    "/seed-users",
    status_code=status.HTTP_201_CREATED,
    summary="Seed default Railway Controller demo users",
)
async def seed_demo_users(db: AsyncSession = Depends(get_db)):
    """Seed standard Railway hackathon demo users if not present."""
    demo_users = [
        {
            "username": "admin",
            "email": "admin@railblock.gov.in",
            "password": "Password123!",
            "role": UserRole.ADMIN.value,
            "department": "OPERATIONS",
        },
        {
            "username": "controller_ndls",
            "email": "controller.ndls@railblock.gov.in",
            "password": "Password123!",
            "role": UserRole.SECTION_CONTROLLER.value,
            "department": "OPERATIONS",
        },
        {
            "username": "station_master_cnb",
            "email": "sm.cnb@railblock.gov.in",
            "password": "Password123!",
            "role": UserRole.STATION_MASTER.value,
            "department": "OPERATIONS",
        },
        {
            "username": "pwi_engineer",
            "email": "pwi@railblock.gov.in",
            "password": "Password123!",
            "role": UserRole.DEPARTMENT_ENGINEER.value,
            "department": "TRACK",
        },
    ]

    created = 0
    for u_data in demo_users:
        stmt = select(User).where(User.username == u_data["username"])
        res = await db.execute(stmt)
        if not res.scalar_one_or_none():
            u = User(
                username=u_data["username"],
                email=u_data["email"],
                hashed_password=get_password_hash(u_data["password"]),
                role=u_data["role"],
                department=u_data["department"],
                is_active=True,
            )
            db.add(u)
            created += 1

    await db.commit()
    return {"message": f"Successfully seeded {created} demo user accounts."}
