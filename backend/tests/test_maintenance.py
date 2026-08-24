"""Tests for maintenance requests API."""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from httpx import AsyncClient


SECTIONS_URL = "/api/v1/sections"
MAINTENANCE_URL = "/api/v1/maintenance"

SAMPLE_SECTION = {
    "section_code": "MAS-AJJ",
    "section_name": "Chennai Central - Arakkonam",
    "division": "Chennai",
    "zone": "Southern Railway",
    "length_km": 80.5,
    "line_type": "DOUBLE",
}


async def _create_section(client: AsyncClient) -> str:
    """Helper to create a section and return its ID."""
    resp = await client.post(SECTIONS_URL, json=SAMPLE_SECTION)
    return resp.json()["id"]


def _make_request(section_id: str, code: str = "MR-TRK-001") -> dict:
    """Create a sample maintenance request payload."""
    return {
        "request_code": code,
        "section_id": section_id,
        "department": "TRACK",
        "activity_type": "Machine Tamping",
        "duration_minutes": 120,
        "priority": "HIGH",
        "deadline": (date.today() + timedelta(days=7)).isoformat(),
        "status": "PENDING",
    }


@pytest.mark.asyncio
async def test_create_maintenance_request(client: AsyncClient):
    """Test creating a maintenance request."""
    section_id = await _create_section(client)
    payload = _make_request(section_id)

    response = await client.post(MAINTENANCE_URL, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["request_code"] == "MR-TRK-001"
    assert data["department"] == "TRACK"
    assert data["activity_type"] == "Machine Tamping"
    assert data["duration_minutes"] == 120
    assert data["status"] == "PENDING"


@pytest.mark.asyncio
async def test_create_duplicate_request(client: AsyncClient):
    """Test duplicate request code returns 409."""
    section_id = await _create_section(client)
    payload = _make_request(section_id)
    await client.post(MAINTENANCE_URL, json=payload)
    response = await client.post(MAINTENANCE_URL, json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_list_maintenance_requests(client: AsyncClient):
    """Test listing maintenance requests."""
    section_id = await _create_section(client)
    await client.post(MAINTENANCE_URL, json=_make_request(section_id, "MR-TRK-001"))
    await client.post(MAINTENANCE_URL, json={
        **_make_request(section_id, "MR-SIG-001"),
        "department": "SIGNAL",
        "activity_type": "Relay Room Maintenance",
    })

    response = await client.get(MAINTENANCE_URL)
    data = response.json()
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_filter_by_department(client: AsyncClient):
    """Test filtering maintenance requests by department."""
    section_id = await _create_section(client)
    await client.post(MAINTENANCE_URL, json=_make_request(section_id, "MR-TRK-001"))
    await client.post(MAINTENANCE_URL, json={
        **_make_request(section_id, "MR-SIG-001"),
        "department": "SIGNAL",
        "activity_type": "Relay Room Maintenance",
    })

    response = await client.get(MAINTENANCE_URL, params={"department": "TRACK"})
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["department"] == "TRACK"


@pytest.mark.asyncio
async def test_filter_by_status(client: AsyncClient):
    """Test filtering by status."""
    section_id = await _create_section(client)
    await client.post(MAINTENANCE_URL, json=_make_request(section_id))

    response = await client.get(MAINTENANCE_URL, params={"status": "PENDING"})
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["status"] == "PENDING"

    response = await client.get(MAINTENANCE_URL, params={"status": "COMPLETED"})
    data = response.json()
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_update_maintenance_status(client: AsyncClient):
    """Test updating maintenance request status."""
    section_id = await _create_section(client)
    create_resp = await client.post(MAINTENANCE_URL, json=_make_request(section_id))
    req_id = create_resp.json()["id"]

    response = await client.put(
        f"{MAINTENANCE_URL}/{req_id}",
        json={"status": "SCHEDULED"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "SCHEDULED"


@pytest.mark.asyncio
async def test_delete_maintenance_request(client: AsyncClient):
    """Test deleting a maintenance request."""
    section_id = await _create_section(client)
    create_resp = await client.post(MAINTENANCE_URL, json=_make_request(section_id))
    req_id = create_resp.json()["id"]

    response = await client.delete(f"{MAINTENANCE_URL}/{req_id}")
    assert response.status_code == 204
