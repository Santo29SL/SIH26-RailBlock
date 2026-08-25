"""Tests for trains API."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


TRAINS_URL = "/api/v1/trains"

SAMPLE_TRAIN = {
    "train_number": "12621",
    "train_name": "Tamil Nadu SF Express",
    "train_type": "SUPERFAST",
    "priority": "HIGH",
}


@pytest.mark.asyncio
async def test_create_train(client: AsyncClient):
    """Test creating a new train."""
    response = await client.post(TRAINS_URL, json=SAMPLE_TRAIN)
    assert response.status_code == 201
    data = response.json()
    assert data["train_number"] == "12621"
    assert data["train_name"] == "Tamil Nadu SF Express"
    assert data["train_type"] == "SUPERFAST"


@pytest.mark.asyncio
async def test_create_duplicate_train(client: AsyncClient):
    """Test duplicate train number returns 409."""
    await client.post(TRAINS_URL, json=SAMPLE_TRAIN)
    response = await client.post(TRAINS_URL, json=SAMPLE_TRAIN)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_list_trains(client: AsyncClient):
    """Test listing trains with pagination."""
    await client.post(TRAINS_URL, json=SAMPLE_TRAIN)
    train2 = {**SAMPLE_TRAIN, "train_number": "12635", "train_name": "Vaigai SF Express"}
    await client.post(TRAINS_URL, json=train2)

    response = await client.get(TRAINS_URL)
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


@pytest.mark.asyncio
async def test_filter_trains_by_type(client: AsyncClient):
    """Test filtering trains by type."""
    await client.post(TRAINS_URL, json=SAMPLE_TRAIN)
    local = {
        "train_number": "66041",
        "train_name": "Chennai Beach Local",
        "train_type": "LOCAL",
        "priority": "LOW",
    }
    await client.post(TRAINS_URL, json=local)

    response = await client.get(TRAINS_URL, params={"train_type": "SUPERFAST"})
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["train_type"] == "SUPERFAST"


@pytest.mark.asyncio
async def test_update_train(client: AsyncClient):
    """Test updating a train."""
    create_resp = await client.post(TRAINS_URL, json=SAMPLE_TRAIN)
    train_id = create_resp.json()["id"]

    response = await client.put(
        f"{TRAINS_URL}/{train_id}",
        json={"train_name": "Tamil Nadu Express (Updated)"},
    )
    assert response.status_code == 200
    assert response.json()["train_name"] == "Tamil Nadu Express (Updated)"
    assert response.json()["train_number"] == "12621"  # Unchanged


@pytest.mark.asyncio
async def test_delete_train(client: AsyncClient):
    """Test deleting a train."""
    create_resp = await client.post(TRAINS_URL, json=SAMPLE_TRAIN)
    train_id = create_resp.json()["id"]

    response = await client.delete(f"{TRAINS_URL}/{train_id}")
    assert response.status_code == 204

    get_resp = await client.get(f"{TRAINS_URL}/{train_id}")
    assert get_resp.status_code == 404
