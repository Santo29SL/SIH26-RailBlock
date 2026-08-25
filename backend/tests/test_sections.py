"""Tests for sections API."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


SECTIONS_URL = "/api/v1/sections"

SAMPLE_SECTION = {
    "section_code": "MAS-AJJ",
    "section_name": "Chennai Central - Arakkonam Jn",
    "division": "Chennai",
    "zone": "Southern Railway",
    "length_km": 80.5,
    "line_type": "DOUBLE",
}


@pytest.mark.asyncio
async def test_create_section(client: AsyncClient):
    """Test creating a new section."""
    response = await client.post(SECTIONS_URL, json=SAMPLE_SECTION)
    assert response.status_code == 201
    data = response.json()
    assert data["section_code"] == "MAS-AJJ"
    assert data["section_name"] == "Chennai Central - Arakkonam Jn"
    assert data["division"] == "Chennai"
    assert data["zone"] == "Southern Railway"
    assert data["length_km"] == 80.5
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_duplicate_section(client: AsyncClient):
    """Test that creating a duplicate section returns 409."""
    await client.post(SECTIONS_URL, json=SAMPLE_SECTION)
    response = await client.post(SECTIONS_URL, json=SAMPLE_SECTION)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_list_sections(client: AsyncClient):
    """Test listing sections with pagination."""
    # Create two sections
    await client.post(SECTIONS_URL, json=SAMPLE_SECTION)
    section2 = {**SAMPLE_SECTION, "section_code": "AJJ-KPD", "section_name": "Arakkonam - Katpadi"}
    await client.post(SECTIONS_URL, json=section2)

    response = await client.get(SECTIONS_URL)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_list_sections_filter_by_zone(client: AsyncClient):
    """Test filtering sections by zone."""
    await client.post(SECTIONS_URL, json=SAMPLE_SECTION)
    section2 = {
        **SAMPLE_SECTION,
        "section_code": "CST-DR",
        "section_name": "CSMT - Dadar",
        "zone": "Central Railway",
        "division": "Mumbai",
    }
    await client.post(SECTIONS_URL, json=section2)

    response = await client.get(SECTIONS_URL, params={"zone": "Southern Railway"})
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["zone"] == "Southern Railway"


@pytest.mark.asyncio
async def test_get_section_by_id(client: AsyncClient):
    """Test getting a section by its ID."""
    create_resp = await client.post(SECTIONS_URL, json=SAMPLE_SECTION)
    section_id = create_resp.json()["id"]

    response = await client.get(f"{SECTIONS_URL}/{section_id}")
    assert response.status_code == 200
    assert response.json()["section_code"] == "MAS-AJJ"


@pytest.mark.asyncio
async def test_get_section_not_found(client: AsyncClient):
    """Test getting a non-existent section returns 404."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"{SECTIONS_URL}/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_section(client: AsyncClient):
    """Test updating a section."""
    create_resp = await client.post(SECTIONS_URL, json=SAMPLE_SECTION)
    section_id = create_resp.json()["id"]

    update_data = {"section_name": "Chennai Central - Arakkonam Junction (Updated)"}
    response = await client.put(f"{SECTIONS_URL}/{section_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["section_name"] == "Chennai Central - Arakkonam Junction (Updated)"
    # Unchanged fields preserved
    assert response.json()["length_km"] == 80.5


@pytest.mark.asyncio
async def test_delete_section(client: AsyncClient):
    """Test deleting a section."""
    create_resp = await client.post(SECTIONS_URL, json=SAMPLE_SECTION)
    section_id = create_resp.json()["id"]

    response = await client.delete(f"{SECTIONS_URL}/{section_id}")
    assert response.status_code == 204

    # Verify deleted
    get_resp = await client.get(f"{SECTIONS_URL}/{section_id}")
    assert get_resp.status_code == 404
