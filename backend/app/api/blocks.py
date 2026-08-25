"""Blocks API — Endpoints for maintenance blocks, G&SR state transitions, and statutory exports."""

from __future__ import annotations

from datetime import datetime, time, timezone
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_db
from app.models.block import Block
from app.models.block_job import BlockJob
from app.models.maintenance_request import MaintenanceRequest
from app.schemas.block import (
    BlockDetailResponse,
    BlockResponse,
    BlockTransitionRequest,
)
from app.schemas.common import BlockStatusEnum, DepartmentEnum, PaginatedResponse
from app.schemas.optimizer import (
    BDMSExportPayload,
    BDMSShadowActivity,
    FormT351NoticePayload,
)
from app.services.crud import calculate_total_pages, get_items

router = APIRouter(prefix="/blocks", tags=["Blocks"])


# ── Helpers ──────────────────────────────────────────────────


def _parse_time_value(time_val: Any, default_time: Optional[time] = None) -> Optional[time]:
    """Parse a time value from string, datetime, or time instance."""
    if not time_val:
        return default_time
    if isinstance(time_val, time):
        return time_val
    if isinstance(time_val, datetime):
        return time_val.time()
    val_str = str(time_val).strip()
    try:
        if "T" in val_str:
            return datetime.fromisoformat(val_str).time()
        parts = val_str.split(":")
        if len(parts) == 3:
            return datetime.strptime(val_str, "%H:%M:%S").time()
        elif len(parts) == 2:
            return datetime.strptime(val_str, "%H:%M").time()
    except Exception:
        pass
    return default_time


def _get_block_primary_department(block: Block, meta: dict) -> DepartmentEnum:
    """Safely resolve the primary department for a maintenance block."""
    raw_dept = meta.get("primary_department")
    if not raw_dept and block.block_jobs:
        for job in block.block_jobs:
            if job.maintenance_request and job.maintenance_request.department:
                raw_dept = job.maintenance_request.department
                break
    return (
        DepartmentEnum(raw_dept)
        if raw_dept in DepartmentEnum._value2member_map_
        else DepartmentEnum.TRACK
    )


# ── Endpoints ────────────────────────────────────────────────


@router.get(
    "",
    response_model=PaginatedResponse[BlockResponse],
    summary="List blocks",
)
async def list_blocks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    section_id: Optional[UUID] = Query(None),
    status_filter: Optional[BlockStatusEnum] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[BlockResponse]:
    """List maintenance blocks with optional section/status filtering."""
    filters = {
        "section_id": section_id,
        "status": status_filter.value if status_filter else None,
    }
    items, total = await get_items(
        db, Block, page=page, page_size=page_size, filters=filters
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.get(
    "/{block_id}",
    response_model=BlockDetailResponse,
    summary="Get block details with jobs",
)
async def get_block_detail(
    block_id: UUID, db: AsyncSession = Depends(get_db)
) -> BlockDetailResponse:
    """Get detailed information about a block including its associated jobs."""
    result = await db.execute(
        select(Block)
        .where(Block.id == block_id)
        .options(selectinload(Block.block_jobs))
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Block not found."
        )
    return block


@router.post(
    "/{block_id}/transition",
    response_model=BlockDetailResponse,
    summary="Execute G&SR Form T/351 Block State Machine Transition",
)
async def transition_block_status(
    block_id: UUID,
    request: BlockTransitionRequest,
    db: AsyncSession = Depends(get_db),
) -> BlockDetailResponse:
    """Execute statutory state machine transition for a maintenance block.

    Follows Indian Railways General and Subsidiary Rules (G&SR) & Form T/351:
    - PROPOSED -> APPROVED (Approval by Railway Authority)
    - APPROVED -> ACTIVE (Disconnection authorization requiring Station Master Private Number)
    - ACTIVE -> COMPLETED (Reconnection authorization requiring Station Master PN & optional TSR)
    - Any state -> CANCELLED
    """
    result = await db.execute(
        select(Block)
        .where(Block.id == block_id)
        .options(selectinload(Block.block_jobs))
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Block not found."
        )

    current_status = block.status
    target_status = request.target_status.value
    meta = dict(block.optimizer_metadata or {})

    # State machine transition validation rules
    if target_status == BlockStatusEnum.APPROVED.value:
        if current_status != BlockStatusEnum.PROPOSED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transition from '{current_status}' to 'APPROVED'. Only PROPOSED blocks can be APPROVED.",
            )
        meta["approved_at"] = datetime.now(timezone.utc).isoformat()
        if request.approved_by:
            meta["approved_by"] = request.approved_by
        if request.remarks:
            meta["approval_remarks"] = request.remarks

    elif target_status == BlockStatusEnum.ACTIVE.value:
        if current_status != BlockStatusEnum.APPROVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transition from '{current_status}' to 'ACTIVE'. Block must be APPROVED before activation.",
            )
        # G&SR Hard Requirement: Station Master Private Number (PN)
        pn = request.disconnection_private_number or request.private_number
        if not pn or not pn.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Station Master Private Number (PN) is mandatory to activate a block possession under G&SR.",
            )
        meta["activated_at"] = datetime.now(timezone.utc).isoformat()
        meta["disconnection_private_number"] = pn.strip()
        meta["private_number"] = pn.strip()
        if request.station_master_name:
            meta["station_master_name"] = request.station_master_name
        if request.field_engineer_name:
            meta["field_engineer_name"] = request.field_engineer_name
        if request.field_engineer_designation:
            meta["field_engineer_designation"] = request.field_engineer_designation
        if request.disconnection_time:
            meta["disconnection_time"] = request.disconnection_time.isoformat()
        if request.remarks:
            meta["disconnection_remarks"] = request.remarks

    elif target_status == BlockStatusEnum.COMPLETED.value:
        if current_status != BlockStatusEnum.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transition from '{current_status}' to 'COMPLETED'. Only ACTIVE blocks can be COMPLETED.",
            )
        # Form T/351 Hard Requirement: Reconnection Private Number (PN)
        recon_pn = request.reconnection_private_number or request.private_number
        if not recon_pn or not recon_pn.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Station Master Reconnection Private Number (PN) is mandatory to complete a block under Form T/351.",
            )
        meta["completed_at"] = datetime.now(timezone.utc).isoformat()
        meta["reconnection_private_number"] = recon_pn.strip()
        if request.reconnection_time:
            meta["reconnection_time"] = request.reconnection_time.isoformat()
        if request.tsr_imposed is not None:
            meta["tsr_imposed"] = request.tsr_imposed
        if request.tsr_speed_kmph is not None:
            meta["tsr_speed_kmph"] = request.tsr_speed_kmph
        if request.remarks:
            meta["reconnection_remarks"] = request.remarks

        # Mark all associated maintenance requests as COMPLETED
        for job in block.block_jobs:
            mr = await db.get(MaintenanceRequest, job.maintenance_request_id)
            if mr:
                mr.status = "COMPLETED"

    elif target_status == BlockStatusEnum.CANCELLED.value:
        meta["cancelled_at"] = datetime.now(timezone.utc).isoformat()
        if request.remarks:
            meta["cancellation_reason"] = request.remarks
        # Reset maintenance requests to PENDING
        for job in block.block_jobs:
            mr = await db.get(MaintenanceRequest, job.maintenance_request_id)
            if mr:
                mr.status = "PENDING"

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target status '{target_status}'.",
        )

    block.status = target_status
    block.optimizer_metadata = meta

    await db.commit()
    await db.refresh(block)

    return block


@router.get(
    "/{block_id}/export-bdms",
    response_model=BDMSExportPayload,
    summary="Export CRIS BDMS JSON Draft Block Payload",
)
async def export_bdms_payload(
    block_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> BDMSExportPayload:
    """Generate Indian Railways CRIS BDMS standard JSON draft block export format."""
    result = await db.execute(
        select(Block)
        .where(Block.id == block_id)
        .options(
            selectinload(Block.section),
            selectinload(Block.block_jobs).options(
                selectinload(BlockJob.maintenance_request)
            ),
        )
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Block not found."
        )

    meta = block.optimizer_metadata or {}
    sec = block.section

    # Parse primary and participating departments
    prim_dept = _get_block_primary_department(block, meta)

    raw_part_depts = meta.get("participating_departments", [])
    if not raw_part_depts:
        raw_part_depts = list(
            set(
                j.maintenance_request.department
                for j in block.block_jobs
                if j.maintenance_request and j.maintenance_request.department
            )
        ) or [prim_dept.value]

    part_depts = [
        DepartmentEnum(d) if d in DepartmentEnum._value2member_map_ else DepartmentEnum.TRACK
        for d in raw_part_depts
    ]

    # Primary activity name
    primary_act = "Track Infrastructure Maintenance"
    if block.block_jobs:
        first_req = block.block_jobs[0].maintenance_request
        if first_req and first_req.activity_type:
            primary_act = first_req.activity_type

    # Shadow activities
    shadow_activities: List[BDMSShadowActivity] = []
    if len(block.block_jobs) > 1:
        for job in block.block_jobs[1:]:
            mr = job.maintenance_request
            if mr:
                d_enum = (
                    DepartmentEnum(mr.department)
                    if mr.department in DepartmentEnum._value2member_map_
                    else DepartmentEnum.TRACK
                )
                ci = float(
                    mr.metadata_json.get("criticality_index", 50.0)
                    if mr.metadata_json
                    else 50.0
                )
                shadow_activities.append(
                    BDMSShadowActivity(
                        request_code=mr.request_code,
                        department=d_enum,
                        activity_type=mr.activity_type,
                        start_offset_minutes=0,
                        duration_minutes=mr.duration_minutes,
                        criticality_index=ci,
                        resources_required=[],
                    )
                )

    block_type = (
        "JOINT_SHADOW"
        if (len(block.block_jobs) > 1 or meta.get("is_joint_shadow_block"))
        else "PRIMARY"
    )

    bdms_id = f"BDMS-{block.block_date.strftime('%Y%m%d')}-{sec.section_code if sec else 'SEC'}-{str(block.id)[:6].upper()}"

    return BDMSExportPayload(
        bdms_message_id=bdms_id,
        message_version="1.0",
        timestamp=datetime.now(timezone.utc),
        division=sec.division if sec else "Chennai",
        zone=sec.zone if sec else "Southern Railway",
        section_code=sec.section_code if sec else "MAS-AJJ",
        section_name=sec.section_name if sec else "Chennai Central - Arakkonam",
        block_code=block.block_code,
        block_type=block_type,
        line_direction=meta.get("line_direction", "UP"),
        block_date=block.block_date,
        granted_start_time=block.start_time,
        granted_end_time=block.end_time,
        total_duration_minutes=block.duration_minutes,
        primary_department=prim_dept,
        participating_departments=part_depts,
        traction_power_isolation=bool(meta.get("traction_power_isolation", False)),
        feeding_post_section=meta.get("feeding_post_section"),
        tsr_imposed=bool(meta.get("tsr_imposed", False)),
        tsr_speed_kmph=meta.get("tsr_speed_kmph"),
        demanding_official=meta.get("approved_by") or "Sr. DEN/Track/MAS",
        authorizing_controller="CPRC/Control/MAS",
        primary_activity=primary_act,
        shadow_activities=shadow_activities,
        status=block.status,
    )


@router.get(
    "/{block_id}/t351-notice",
    response_model=FormT351NoticePayload,
    summary="Export Form T/351 Disconnection Notice Payload",
)
async def export_t351_notice(
    block_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> FormT351NoticePayload:
    """Generate statutory Indian Railways Form T/351 Disconnection Notice payload."""
    result = await db.execute(
        select(Block)
        .where(Block.id == block_id)
        .options(
            selectinload(Block.section),
            selectinload(Block.block_jobs).options(
                selectinload(BlockJob.maintenance_request)
            ),
        )
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Block not found."
        )

    meta = block.optimizer_metadata or {}
    sec = block.section
    sec_code = sec.section_code if sec else "MAS-AJJ"
    station_code = sec_code.split("-")[0] if "-" in sec_code else sec_code

    # Department
    dept = _get_block_primary_department(block, meta)

    # Work nature summary
    work_list = [
        j.maintenance_request.activity_type
        for j in block.block_jobs
        if j.maintenance_request and j.maintenance_request.activity_type
    ]
    work_nature = ", ".join(work_list) if work_list else "Track Infrastructure Maintenance"

    pn = meta.get("disconnection_private_number") or meta.get("private_number")
    if not pn:
        if block.status in (BlockStatusEnum.PROPOSED.value, BlockStatusEnum.APPROVED.value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Form T/351 Disconnection Notice requires an authenticated Station Master Private Number (PN). Block must be activated under G&SR before notice issuance.",
            )
        pn = f"PN-{str(block.id)[:4].upper()}"

    recon_pn = meta.get("reconnection_private_number")
    is_completed = block.status == BlockStatusEnum.COMPLETED.value

    recon_time = _parse_time_value(meta.get("reconnection_time"))
    discon_time = _parse_time_value(meta.get("disconnection_time"), default_time=block.start_time)

    return FormT351NoticePayload(
        form_type="T/351-B" if is_completed else "T/351",
        notice_number=f"T351/{station_code}/{block.block_date.strftime('%Y%m%d')}/{block.block_code[-3:] if len(block.block_code) >= 3 else '001'}",
        station_code=station_code,
        section_code=sec_code,
        date=block.block_date,
        disconnection_time=discon_time,
        line_affected=f"{sec.section_name if sec else sec_code} ({meta.get('line_direction', 'UP Main Line')})",
        work_nature=work_nature,
        department=dept,
        disconnection_private_number=pn,
        station_master_name=meta.get("station_master_name", "Station Master on Duty"),
        field_engineer_name=meta.get("field_engineer_name", "P. V. Nair"),
        field_engineer_designation=meta.get("field_engineer_designation", "SSE/Permanent Way/MAS"),
        reconnection_private_number=recon_pn,
        reconnection_time=recon_time,
        tsr_imposed=bool(meta.get("tsr_imposed", False)),
        tsr_speed_kmph=meta.get("tsr_speed_kmph"),
        remarks=meta.get("approval_remarks") or meta.get("disconnection_remarks") or meta.get("notes"),
        status="RECONNECTED" if is_completed else "DISCONNECTED",
    )
