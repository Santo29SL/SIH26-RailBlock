"""Stage 1: Legacy Data Ingestion API Endpoints (TMS, SMMS, TDMS)."""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.services.adapters import LegacySystemAdapter

router = APIRouter(prefix="/ingest", tags=["Stage 1 — Legacy Data Ingestion"])


class IngestTMSPayload(BaseModel):
    """TMS Track Management System ingestion payload."""

    section_id: uuid.UUID
    usfd_classification: Optional[str] = Field("IMR", description="USFD flaw classification (GOOD, IMR, IMRW, OBS, OBSW)")
    usfd_flaw_severity: Optional[int] = Field(None, ge=0, le=3, description="USFD flaw numeric level (0 to 3)")
    tgi_deviation: float = Field(82.5, ge=0.0, le=100.0, description="TGI index deviation")
    chainage_km: float = Field(142.5, description="Track chainage kilometer marker")
    curvature_deg: float = Field(0.0, ge=0.0, le=16.0, description="Track curvature in degrees")
    duration_minutes: int = Field(150, ge=15, le=480, description="Estimated work duration")


class IngestSMMSPayload(BaseModel):
    """SMMS Signalling Maintenance System ingestion payload."""

    section_id: uuid.UUID
    point_failure_risk: float = Field(75.0, ge=0.0, le=100.0, description="Point failure risk score")
    station_code: str = Field("CNB", description="Station code")
    duration_minutes: int = Field(90, ge=15, le=480, description="Estimated work duration")


class IngestTDMSPayload(BaseModel):
    """TDMS Traction Distribution System ingestion payload."""

    section_id: uuid.UUID
    ohe_wear_pct: float = Field(65.0, ge=0.0, le=100.0, description="OHE wire wear percentage")
    feeding_post: str = Field("FP-NDLS-01", description="Feeding post substation identifier")
    duration_minutes: int = Field(120, ge=15, le=480, description="Estimated work duration")


@router.post("/tms", status_code=status.HTTP_201_CREATED, summary="Ingest TMS Track Defect")
async def ingest_tms_defect(payload: IngestTMSPayload, db: AsyncSession = Depends(get_db)):
    """Ingest track defect record from TMS API feed."""
    req = await LegacySystemAdapter.ingest_tms_defect(
        db=db,
        section_id=payload.section_id,
        usfd_classification=payload.usfd_classification or "IMR",
        usfd_flaw_severity=payload.usfd_flaw_severity,
        tgi_deviation=payload.tgi_deviation,
        chainage_km=payload.chainage_km,
        curvature_deg=payload.curvature_deg,
        estimated_duration_min=payload.duration_minutes,
    )
    return {
        "status": "ingested",
        "request_id": str(req.id),
        "request_code": req.request_code,
        "department": req.department,
        "priority": req.priority,
    }


@router.post("/smms", status_code=status.HTTP_201_CREATED, summary="Ingest SMMS Signal Defect")
async def ingest_smms_defect(payload: IngestSMMSPayload, db: AsyncSession = Depends(get_db)):
    """Ingest signalling defect record from SMMS API feed."""
    req = await LegacySystemAdapter.ingest_smms_defect(
        db=db,
        section_id=payload.section_id,
        point_failure_risk=payload.point_failure_risk,
        station_code=payload.station_code,
        estimated_duration_min=payload.duration_minutes,
    )
    return {
        "status": "ingested",
        "request_id": str(req.id),
        "request_code": req.request_code,
        "department": req.department,
        "priority": req.priority,
    }


@router.post("/tdms", status_code=status.HTTP_201_CREATED, summary="Ingest TDMS Traction Defect")
async def ingest_tdms_defect(payload: IngestTDMSPayload, db: AsyncSession = Depends(get_db)):
    """Ingest traction defect record from TDMS API feed."""
    req = await LegacySystemAdapter.ingest_tdms_defect(
        db=db,
        section_id=payload.section_id,
        ohe_wear_pct=payload.ohe_wear_pct,
        feeding_post=payload.feeding_post,
        estimated_duration_min=payload.duration_minutes,
    )
    return {
        "status": "ingested",
        "request_id": str(req.id),
        "request_code": req.request_code,
        "department": req.department,
        "priority": req.priority,
    }
