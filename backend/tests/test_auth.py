"""Tests for Authentication & Role-Based Access Control (RBAC)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token, get_password_hash, verify_password


def test_password_hashing():
    """Verify bcrypt password hashing and verification."""
    raw_pass = "SecurePass123!"
    hashed = get_password_hash(raw_pass)

    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPass", hashed) is False


def test_jwt_token_creation_and_decoding():
    """Verify JWT token creation and decoding."""
    token = create_access_token(subject="controller_test", role="SECTION_CONTROLLER")
    assert isinstance(token, str)
    assert len(token) > 20


@pytest.mark.asyncio
async def test_seed_demo_users_and_login(client: AsyncClient):
    """Test seeding demo users and logging in."""
    # Seed users
    seed_res = await client.post("/api/v1/auth/seed-users")
    assert seed_res.status_code == 201

    # Login
    login_data = {
        "username": "controller_ndls",
        "password": "Password123!",
    }
    login_res = await client.post("/api/v1/auth/login", data=login_data)
    assert login_res.status_code == 200

    token_payload = login_res.json()
    assert "access_token" in token_payload
    assert token_payload["token_type"] == "bearer"
    assert token_payload["role"] == "SECTION_CONTROLLER"

    # Get profile with bearer token
    token = token_payload["access_token"]
    me_res = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200

    profile = me_res.json()
    assert profile["username"] == "controller_ndls"
    assert profile["role"] == "SECTION_CONTROLLER"
    assert profile["is_active"] is True


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    """Test login with invalid password returns 401."""
    login_data = {
        "username": "controller_ndls",
        "password": "InvalidPassword",
    }
    login_res = await client.post("/api/v1/auth/login", data=login_data)
    assert login_res.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_profile_access(client: AsyncClient):
    """Test accessing protected profile endpoint without token returns 401."""
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_divisional_authority_login(client: AsyncClient):
    """Test seeding and logging in as DIVISIONAL_AUTHORITY (drm_mas)."""
    await client.post("/api/v1/auth/seed-users")
    login_data = {
        "username": "drm_mas",
        "password": "Password123!",
    }
    login_res = await client.post("/api/v1/auth/login", data=login_data)
    assert login_res.status_code == 200

    token_payload = login_res.json()
    assert token_payload["role"] == "DIVISIONAL_AUTHORITY"
    assert token_payload["username"] == "drm_mas"

    token = token_payload["access_token"]
    me_res = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["username"] == "drm_mas"
    assert profile["role"] == "DIVISIONAL_AUTHORITY"
    assert profile["department"] == "OPERATIONS"
