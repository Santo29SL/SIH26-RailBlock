"""Tests for Stage 1 Legacy System Ingestion and Stage 6 WebSocket Stream."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from app.models.section import Section


@pytest.mark.asyncio
async def test_ingest_tms_smms_tdms(client: AsyncClient, db_session):
    """Test ingesting defects from TMS, SMMS, and TDMS endpoints."""
    # Create section
    section = Section(
        section_code="SEC-INGEST-01",
        section_name="Kanpur - New Delhi Section",
        zone="NCR",
        division="PRYJ",
        length_km=100.0,
        line_type="DOUBLE",
    )
    db_session.add(section)
    await db_session.commit()
    await db_session.refresh(section)

    # 1. TMS Track Ingestion
    tms_res = await client.post(
        "/api/v1/ingest/tms",
        json={
            "section_id": str(section.id),
            "usfd_flaw_severity": 3,
            "tgi_deviation": 88.0,
            "chainage_km": 42.5,
            "duration_minutes": 180,
        },
    )
    assert tms_res.status_code == 201
    assert tms_res.json()["department"] == "TRACK"

    # 2. SMMS Signal Ingestion
    smms_res = await client.post(
        "/api/v1/ingest/smms",
        json={
            "section_id": str(section.id),
            "point_failure_risk": 82.0,
            "station_code": "CNB",
            "duration_minutes": 90,
        },
    )
    assert smms_res.status_code == 201
    assert smms_res.json()["department"] == "SIGNAL"

    # 3. TDMS Traction Ingestion
    tdms_res = await client.post(
        "/api/v1/ingest/tdms",
        json={
            "section_id": str(section.id),
            "ohe_wear_pct": 72.0,
            "feeding_post": "FP-CNB-01",
            "duration_minutes": 120,
        },
    )
    assert tdms_res.status_code == 201
    assert tdms_res.json()["department"] == "TRACTION"

    # 4. TMS Track Ingestion with statutory IRPWM USFD Classification & Curvature
    tms_imrw = await client.post(
        "/api/v1/ingest/tms",
        json={
            "section_id": str(section.id),
            "usfd_classification": "IMRW",
            "tgi_deviation": 90.0,
            "chainage_km": 142.5,
            "curvature_deg": 3.5,
            "duration_minutes": 180,
        },
    )
    assert tms_imrw.status_code == 201
    assert tms_imrw.json()["priority"] == "CRITICAL"
    assert tms_imrw.json()["department"] == "TRACK"

    tms_obs = await client.post(
        "/api/v1/ingest/tms",
        json={
            "section_id": str(section.id),
            "usfd_classification": "OBS",
            "tgi_deviation": 75.0,
            "chainage_km": 150.0,
            "curvature_deg": 1.0,
            "duration_minutes": 120,
        },
    )
    assert tms_obs.status_code == 201
    assert tms_obs.json()["priority"] == "MEDIUM"
