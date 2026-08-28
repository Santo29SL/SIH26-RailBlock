"""Stage 1: Legacy Data System Integration Adapters (TMS, SMMS, TDMS).

Simulates read-only edge gateway data ingestion from Indian Railways legacy databases:
- Track Management System (TMS): USFD flaw logs, TGI index, track defects.
- Signalling Maintenance & Management System (SMMS): Point machines, axle counters.
- Traction Distribution Management System (TDMS): OHE contact wire wear, FP/SP power blocks.
"""

from __future__ import annotations

import uuid
from datetime import date, timedelta
from typing import Any, Dict, List

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.maintenance_request import MaintenanceRequest
from app.models.enums import Department, Priority, MaintenanceStatus


class LegacySystemAdapter:
    """Ingestion engine for Indian Railways legacy engineering systems."""

    @staticmethod
    async def ingest_tms_defect(
        db: AsyncSession,
        section_id: uuid.UUID,
        usfd_classification: str = "IMR",
        usfd_flaw_severity: Optional[int] = None,
        tgi_deviation: float = 82.5,
        chainage_km: float = 142.5,
        curvature_deg: float = 0.0,
        estimated_duration_min: int = 150,
    ) -> MaintenanceRequest:
        """Ingest track defect from TMS with IRPWM USFD classification and Curvature."""
        # Map USFD classification string to severity and priority
        usfd_upper = (usfd_classification or "GOOD").upper()
        if usfd_flaw_severity is None:
            if usfd_upper in ("IMRW", "IMR"):
                severity = 3 if usfd_upper == "IMRW" else 2
                prio = Priority.CRITICAL.value if usfd_upper == "IMRW" else Priority.HIGH.value
            elif usfd_upper in ("OBSW", "OBS"):
                severity = 2 if usfd_upper == "OBSW" else 1
                prio = Priority.HIGH.value if usfd_upper == "OBSW" else Priority.MEDIUM.value
            else:
                severity = 0
                prio = Priority.LOW.value
        else:
            severity = usfd_flaw_severity
            prio = Priority.HIGH.value if severity >= 2 else Priority.MEDIUM.value

        req_code = f"TMS-{uuid.uuid4().hex[:6].upper()}"
        req = MaintenanceRequest(
            request_code=req_code,
            section_id=section_id,
            department=Department.TRACK.value,
            activity_type="RAIL_RENEWAL_USFD",
            duration_minutes=estimated_duration_min,
            priority=prio,
            deadline=date.today() + timedelta(days=3),
            status=MaintenanceStatus.PENDING.value,
            metadata_json={
                "source_system": "TMS",
                "usfd_classification": usfd_upper,
                "usfd_flaw_severity": severity,
                "flaw_category": "T1" if usfd_upper in ("IMR", "IMRW") else ("T2" if usfd_upper in ("OBS", "OBSW") else "NONE"),
                "tgi_deviation": tgi_deviation,
                "chainage_start_km": chainage_km,
                "chainage_end_km": chainage_km + 2.5,
                "curvature_deg": curvature_deg,
                "speed_restriction_kmh": 30.0 if severity >= 2 else 50.0,
            },
        )
        db.add(req)
        await db.commit()
        await db.refresh(req)
        return req

    @staticmethod
    async def ingest_smms_defect(
        db: AsyncSession,
        section_id: uuid.UUID,
        point_failure_risk: float = 75.0,
        station_code: str = "CNB",
        estimated_duration_min: int = 90,
    ) -> MaintenanceRequest:
        """Ingest S&T defect from SMMS (Signalling Maintenance & Management System)."""
        req_code = f"S&T-{uuid.uuid4().hex[:6].upper()}"
        req = MaintenanceRequest(
            request_code=req_code,
            section_id=section_id,
            department=Department.SIGNAL.value,
            activity_type="POINT_MACHINE_OVERHAUL",
            duration_minutes=estimated_duration_min,
            priority=Priority.HIGH.value if point_failure_risk > 70 else Priority.MEDIUM.value,
            deadline=date.today() + timedelta(days=5),
            status=MaintenanceStatus.PENDING.value,
            metadata_json={
                "source_system": "SMMS",
                "point_failure_risk": point_failure_risk,
                "station_code": station_code,
                "asset_id": f"POINT-MACHINE-{station_code}-102A",
            },
        )
        db.add(req)
        await db.commit()
        await db.refresh(req)
        return req

    @staticmethod
    async def ingest_tdms_defect(
        db: AsyncSession,
        section_id: uuid.UUID,
        ohe_wear_pct: float = 65.0,
        feeding_post: str = "FP-NDLS-01",
        estimated_duration_min: int = 120,
    ) -> MaintenanceRequest:
        """Ingest traction defect from TDMS (Traction Distribution Management System)."""
        req_code = f"TRD-{uuid.uuid4().hex[:6].upper()}"
        req = MaintenanceRequest(
            request_code=req_code,
            section_id=section_id,
            department=Department.TRACTION.value,
            activity_type="OHE_WIRE_TENSIONING",
            duration_minutes=estimated_duration_min,
            priority=Priority.HIGH.value if ohe_wear_pct > 60 else Priority.MEDIUM.value,
            deadline=date.today() + timedelta(days=4),
            status=MaintenanceStatus.PENDING.value,
            metadata_json={
                "source_system": "TDMS",
                "ohe_insulator_wear": ohe_wear_pct,
                "feeding_post": feeding_post,
                "power_isolation_required": True,
            },
        )
        db.add(req)
        await db.commit()
        await db.refresh(req)
        return req
