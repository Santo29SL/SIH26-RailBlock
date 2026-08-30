"""Optimizer API router — Block schedule optimization, What-If simulation, and fast rescheduling.

Provides:
- POST /api/v1/optimizer/run: Executes Stage 3 -> 4 -> 5 pipeline and optionally persists blocks to DB.
- POST /api/v1/optimizer/simulate: Real-time in-memory What-If calculation with HMAC commit tokens.
- POST /api/v1/optimizer/commit-simulation: Commits verified What-If simulation to DB.
- POST /api/v1/optimizer/reschedule: Real-time fast greedy rescheduling and SLW fallback advisory.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.dependencies import get_db
from app.models.block import Block
from app.models.block_job import BlockJob
from app.models.compatibility_rule import CompatibilityRule
from app.models.maintenance_request import MaintenanceRequest
from app.models.resource import Resource
from app.models.section import Section
from app.models.train_movement import TrainMovement
from app.schemas.common import (
    BlockStatusEnum,
    DepartmentEnum,
    LineTypeEnum,
    TrainPriorityEnum,
    TrainTypeEnum,
)
from app.schemas.optimizer import (
    CommitSimulationRequest,
    CommitSimulationResponse,
    ConflictingTrainImpact,
    DetentionTierEnum,
    OptimizerRunRequest,
    OptimizerRunResponse,
    ScheduledBlockJobSummary,
    ScheduledBlockSummary,
    WhatIfSimulationRequest,
    WhatIfSimulationResponse,
)
from app.schemas.rescheduler import (
    RescheduleActionEnum,
    RescheduleRequest,
    RescheduleResponse,
    SLWAdvisorySchema,
)
from app.services.clustering import compute_criticality_index
from app.services.optimizer import ScheduledBlock, run_optimization_pipeline
from app.services.rescheduler import reschedule_on_disruption

router = APIRouter(prefix="/optimizer", tags=["Optimizer"])


# ── Shared Serialization Helper ─────────────────────────────


def _to_scheduled_block_summary(
    sb: ScheduledBlock,
    section_code_map: Optional[Dict[UUID, str]] = None,
) -> ScheduledBlockSummary:
    """Convert ScheduledBlock domain entity into a serializable ScheduledBlockSummary schema."""
    job_summaries: List[ScheduledBlockJobSummary] = []
    for act in sb.activities:
        dept_enum = (
            act.department
            if isinstance(act.department, DepartmentEnum)
            else DepartmentEnum(act.department)
        )
        job_summaries.append(
            ScheduledBlockJobSummary(
                id=act.id,
                maintenance_request_id=act.maintenance_request_id,
                request_code=act.request_code,
                department=dept_enum,
                activity_type=act.activity_type,
                duration_minutes=act.duration_minutes,
                start_offset_minutes=act.start_offset_minutes,
                end_offset_minutes=act.end_offset_minutes,
                criticality_index=act.criticality_index,
                is_primary=act.is_primary,
            )
        )

    prim_dept_enum = (
        sb.primary_department
        if isinstance(sb.primary_department, DepartmentEnum)
        else DepartmentEnum(sb.primary_department)
    )
    part_depts_enum = [
        d if isinstance(d, DepartmentEnum) else DepartmentEnum(d)
        for d in sb.participating_departments
    ]
    status_enum = (
        sb.status
        if isinstance(sb.status, BlockStatusEnum)
        else BlockStatusEnum(sb.status)
    )

    sec_code = sb.section_code or (
        section_code_map.get(sb.section_id) if section_code_map else None
    )

    return ScheduledBlockSummary(
        id=sb.id,
        block_code=sb.block_code or f"BLK-{sb.block_date.strftime('%Y%m%d')}-001",
        section_id=sb.section_id,
        section_code=sec_code,
        block_date=sb.block_date,
        start_time=sb.start_time,
        end_time=sb.end_time,
        duration_minutes=sb.duration_minutes,
        is_joint_shadow_block=sb.is_joint_shadow_block,
        primary_department=prim_dept_enum,
        participating_departments=part_depts_enum,
        total_criticality_index=sb.total_criticality_index,
        shadow_overlap_hours=sb.shadow_overlap_hours,
        estimated_train_detention_minutes=sb.estimated_train_detention_minutes,
        status=status_enum,
        optimizer_metadata=sb.optimizer_metadata,
        jobs=job_summaries,
    )


# ── HMAC Commit Token Cryptographic Helpers ─────────────────


def _generate_commit_token(payload: Dict[str, Any], secret_key: str) -> str:
    """Generate a tamper-proof HMAC-SHA256 signed token carrying simulation payload."""
    payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    b64_payload = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("utf-8")
    sig = hmac.new(
        secret_key.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return f"{b64_payload}.{sig}"


def _verify_commit_token(token: str, secret_key: str) -> Dict[str, Any]:
    """Verify HMAC signature and expiration for a simulation commit token."""
    parts = token.split(".")
    if len(parts) != 2:
        raise ValueError("Malformed commit token format.")

    b64_payload, signature = parts
    expected_sig = hmac.new(
        secret_key.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_sig):
        raise ValueError("Invalid commit token signature.")

    try:
        payload_bytes = base64.urlsafe_b64decode(b64_payload.encode("utf-8"))
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as exc:
        raise ValueError(f"Failed to decode token payload: {exc}")

    expires_at_str = payload.get("expires_at")
    if not expires_at_str:
        raise ValueError("Token missing expiration timestamp.")

    expires_at = datetime.fromisoformat(expires_at_str)
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise TimeoutError("Simulation commit token has expired.")

    return payload


# ── Endpoint 1: Run Optimizer Pipeline & Persist ─────────────


@router.post(
    "/run",
    response_model=OptimizerRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Block Schedule Optimizer Pipeline",
)
async def run_optimizer(
    request: OptimizerRunRequest,
    horizon_days: Optional[int] = Query(
        None,
        ge=1,
        le=30,
        description="Planning horizon in days (7 for weekly, 30 for monthly). Overrides body if provided.",
    ),
    db: AsyncSession = Depends(get_db),
) -> OptimizerRunResponse:
    """Execute Stage 2 -> Stage 3 -> Stage 4 -> Stage 5 block optimizer pipeline.

    Fetches track sections, active train movements, pending maintenance requests,
    resources, and compatibility rules from the database, runs Google OR-Tools
    CP-SAT constraint programming solver, and optionally persists scheduled Block and BlockJob records.
    """
    effective_horizon = horizon_days if horizon_days is not None else request.horizon_days

    # 1. Fetch sections
    section_query = select(Section)
    if request.section_ids:
        section_query = section_query.where(Section.id.in_(request.section_ids))
    sec_result = await db.execute(section_query)
    sections = list(sec_result.scalars().all())

    target_section_ids = [s.id for s in sections]
    section_code_map = {s.id: s.section_code for s in sections}

    # 2. Fetch train movements on target sections for the planning horizon
    movement_query = (
        select(TrainMovement)
        .options(selectinload(TrainMovement.train))
        .where(
            TrainMovement.section_id.in_(target_section_ids),
            TrainMovement.is_active == True,
        )
    )
    mov_result = await db.execute(movement_query)
    movements = list(mov_result.scalars().all())

    # 3. Fetch pending maintenance requests
    req_query = (
        select(MaintenanceRequest)
        .options(selectinload(MaintenanceRequest.resource))
        .where(
            MaintenanceRequest.section_id.in_(target_section_ids),
            MaintenanceRequest.status == "PENDING",
        )
    )
    req_result = await db.execute(req_query)
    pending_requests = list(req_result.scalars().all())

    # 4. Fetch resources and compatibility rules
    res_result = await db.execute(select(Resource))
    resources = list(res_result.scalars().all())

    rule_result = await db.execute(select(CompatibilityRule))
    compatibility_rules = list(rule_result.scalars().all())

    # 5. Run Stage 2 -> 3 -> 4 -> 5 optimization pipeline
    optimization_result = run_optimization_pipeline(
        movements=movements,
        requests=pending_requests,
        resources=resources,
        compatibility_rules=compatibility_rules,
        target_date=request.target_date,
        section_code_map=section_code_map,
        safety_buffer_minutes=request.safety_buffer_minutes,
        min_gap_minutes=request.min_gap_minutes,
        alpha_shadow=request.alpha_shadow_weight,
        beta_detention=request.beta_detention_weight,
        max_solver_time_seconds=request.solver_timeout_seconds,
        horizon_days=effective_horizon,
    )

    # 6. Optionally persist to PostgreSQL
    if request.persist_to_db and optimization_result.scheduled_blocks:
        covered_request_map = {r.id: r for r in pending_requests}

        for scheduled_block in optimization_result.scheduled_blocks:
            prim_dept_str = (
                scheduled_block.primary_department.value
                if hasattr(scheduled_block.primary_department, "value")
                else str(scheduled_block.primary_department)
            )
            part_depts_str = [
                (d.value if hasattr(d, "value") else str(d))
                for d in scheduled_block.participating_departments
            ]
            status_str = (
                scheduled_block.status.value
                if hasattr(scheduled_block.status, "value")
                else str(scheduled_block.status)
            )

            # Impacted train count (number of conflicting train movements)
            conflicts_count = len(
                scheduled_block.optimizer_metadata.get("conflicting_trains", [])
            )

            db_block = Block(
                id=scheduled_block.id,
                block_code=scheduled_block.block_code
                or f"BLK-{scheduled_block.block_date.strftime('%Y%m%d')}-{uuid4().hex[:4].upper()}",
                section_id=scheduled_block.section_id,
                block_date=scheduled_block.block_date,
                start_time=scheduled_block.start_time,
                end_time=scheduled_block.end_time,
                duration_minutes=scheduled_block.duration_minutes,
                train_impact_count=conflicts_count,
                impact_score=scheduled_block.total_criticality_index,
                status=status_str,
                optimizer_metadata={
                    **scheduled_block.optimizer_metadata,
                    "is_joint_shadow_block": scheduled_block.is_joint_shadow_block,
                    "primary_department": prim_dept_str,
                    "participating_departments": part_depts_str,
                    "shadow_overlap_hours": scheduled_block.shadow_overlap_hours,
                    "line_direction": scheduled_block.line_direction,
                    "traction_power_isolation": scheduled_block.traction_power_isolation,
                    "feeding_post_section": scheduled_block.feeding_post_section,
                    "total_criticality_index": scheduled_block.total_criticality_index,
                    "estimated_train_detention_minutes": scheduled_block.estimated_train_detention_minutes,
                },
            )
            db.add(db_block)

            # Persist associated BlockJob records
            for seq_idx, act in enumerate(scheduled_block.activities, start=1):
                db_job = BlockJob(
                    id=act.id or uuid4(),
                    block_id=scheduled_block.id,
                    maintenance_request_id=act.maintenance_request_id,
                    sequence_order=seq_idx,
                )
                db.add(db_job)

                # Mark request as SCHEDULED
                if act.maintenance_request_id in covered_request_map:
                    covered_request_map[act.maintenance_request_id].status = "SCHEDULED"

        await db.commit()

    # 7. Build and return response using shared helper
    scheduled_summaries = [
        _to_scheduled_block_summary(sb, section_code_map=section_code_map)
        for sb in optimization_result.scheduled_blocks
    ]

    return OptimizerRunResponse(
        run_id=optimization_result.run_id,
        target_date=optimization_result.target_date,
        solver_status=optimization_result.solver_status,
        total_blocks_scheduled=optimization_result.total_blocks_scheduled,
        total_maintenance_requests_covered=optimization_result.total_maintenance_requests_covered,
        total_unassigned_requests=optimization_result.total_unassigned_requests,
        total_shadow_overlap_hours=optimization_result.total_shadow_overlap_hours,
        total_train_detention_minutes=optimization_result.total_train_detention_minutes,
        total_criticality_index=optimization_result.total_criticality_index,
        objective_value=optimization_result.objective_value,
        solver_execution_time_ms=optimization_result.solver_execution_time_ms,
        scheduled_blocks=scheduled_summaries,
        unassigned_request_ids=optimization_result.unassigned_request_ids,
    )


# ── Endpoint 2: What-If Simulation Engine ────────────────────


@router.post(
    "/simulate",
    response_model=WhatIfSimulationResponse,
    status_code=status.HTTP_200_OK,
    summary="Simulate What-If Corridor Maintenance Scenario",
)
async def simulate_what_if(
    request: WhatIfSimulationRequest,
    db: AsyncSession = Depends(get_db),
) -> WhatIfSimulationResponse:
    """Run an in-memory What-If simulation without persisting to PostgreSQL.

    Evaluates train detention, Tier 1 VIP train conflicts (Rajdhani / Vande Bharat),
    safety risk delta, and shadow bundling efficiency, returning a cryptographically
    signed HMAC token for verified one-click commitment.
    """
    # 1. Fetch section
    sec_res = await db.execute(select(Section).where(Section.id == request.section_id))
    section = sec_res.scalar_one_or_none()
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Section {request.section_id} not found.",
        )

    # 2. Fetch train movements on this section
    mov_query = (
        select(TrainMovement)
        .options(selectinload(TrainMovement.train))
        .where(
            TrainMovement.section_id == request.section_id,
            TrainMovement.is_active == True,
            TrainMovement.day_of_week == request.target_date.weekday(),
        )
    )
    mov_result = await db.execute(mov_query)
    movements = list(mov_result.scalars().all())

    # 3. Fetch maintenance requests
    req_query = select(MaintenanceRequest).where(
        MaintenanceRequest.id.in_(request.maintenance_request_ids)
    )
    req_result = await db.execute(req_query)
    reqs = list(req_result.scalars().all())

    if not reqs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid maintenance requests found for the provided IDs.",
        )

    # 4. Compute proposed Block start/end datetimes
    block_start_dt = datetime.combine(request.target_date, request.start_time)
    block_end_dt = datetime.combine(request.target_date, request.end_time)
    if block_end_dt <= block_start_dt:
        block_end_dt += timedelta(days=1)
    proposed_duration_minutes = int((block_end_dt - block_start_dt).total_seconds() // 60)

    # Enforce statutory Safety Buffer before and after the Block
    safety_buffer_start_dt = block_start_dt - timedelta(
        minutes=settings.DEFAULT_SAFETY_BUFFER_MINUTES
    )
    safety_buffer_end_dt = block_end_dt + timedelta(
        minutes=settings.DEFAULT_SAFETY_BUFFER_MINUTES
    )

    # 5. Detect conflicting train movements
    conflicting_trains: List[ConflictingTrainImpact] = []
    total_detention_minutes = 0
    has_vip_conflict = False

    for m in movements:
        train_departure_dt = datetime.combine(request.target_date, m.departure_time)
        train_arrival_dt = datetime.combine(request.target_date, m.arrival_time)
        if train_arrival_dt <= train_departure_dt:
            train_arrival_dt += timedelta(days=1)

        # Check temporal overlap with proposed Block and statutory Safety Buffer
        if max(safety_buffer_start_dt, train_departure_dt) < min(
            safety_buffer_end_dt, train_arrival_dt
        ):
            train = m.train
            t_name = train.train_name if train else "Express Service"
            t_num = train.train_number if train else "00000"
            t_type_str = train.train_type if train else "EXPRESS"
            priority_str = train.priority if train else "MEDIUM"

            # Classify detention tier & VIP zero-detention hard constraint (ADR 0003)
            is_vip_name = any(
                vip_keyword in t_name.upper()
                for vip_keyword in ["RAJDHANI", "VANDE BHARAT", "SHATABDI", "TEJAS"]
            )
            is_vip = is_vip_name or t_type_str == "SUPERFAST" or priority_str == "HIGH"

            if is_vip:
                tier = DetentionTierEnum.TIER_1_VIP
                is_hard = True
                has_vip_conflict = True
            elif t_type_str == "FREIGHT" or priority_str == "LOW":
                tier = DetentionTierEnum.TIER_3_FREIGHT
                is_hard = False
            else:
                tier = DetentionTierEnum.TIER_2_EXPRESS
                is_hard = False

            # Calculate expected detention (time delayed until Safety Buffer clears)
            detention = max(
                15,
                int(
                    (
                        (
                            block_end_dt
                            + timedelta(minutes=settings.DEFAULT_SAFETY_BUFFER_MINUTES)
                        )
                        - train_departure_dt
                    ).total_seconds()
                    // 60
                ),
            )
            total_detention_minutes += detention

            conflicting_trains.append(
                ConflictingTrainImpact(
                    train_id=m.train_id,
                    train_number=t_num,
                    train_name=t_name,
                    train_type=TrainTypeEnum(t_type_str)
                    if t_type_str in TrainTypeEnum._value2member_map_
                    else TrainTypeEnum.EXPRESS,
                    priority=TrainPriorityEnum(priority_str)
                    if priority_str in TrainPriorityEnum._value2member_map_
                    else TrainPriorityEnum.MEDIUM,
                    scheduled_departure=m.departure_time,
                    scheduled_arrival=m.arrival_time,
                    expected_detention_minutes=detention,
                    detention_penalty_tier=tier,
                    is_hard_conflict=is_hard,
                )
            )

    # 6. Evaluate feasibility & metrics
    # If SLW fallback allowed on double line, VIP conflict is manageable with advisory
    is_double_line = section.line_type in (
        LineTypeEnum.DOUBLE.value,
        LineTypeEnum.TRIPLE.value,
        LineTypeEnum.QUADRUPLE.value,
    )
    is_feasible = (not has_vip_conflict) or (request.allow_slw_fallback and is_double_line)
    slw_advisory_req = bool(
        request.allow_slw_fallback
        and is_double_line
        and (has_vip_conflict or total_detention_minutes > 30)
    )

    # Criticality Index resolved
    total_req_duration = sum(r.duration_minutes for r in reqs)
    total_ci = sum(compute_criticality_index(r, request.target_date) for r in reqs)
    ci_preserved_pct = min(
        100.0,
        round(
            (len(reqs) / max(1, len(request.maintenance_request_ids))) * 100.0, 1
        ),
    )

    # Shadow efficiency score
    shadow_eff = (
        round(
            (total_req_duration - proposed_duration_minutes)
            / max(1, proposed_duration_minutes),
            2,
        )
        if len(reqs) > 1
        else 1.0
    )
    shadow_eff = max(0.0, shadow_eff)

    # Composite risk score delta
    risk_delta = round(
        (total_detention_minutes * 0.4)
        + (50.0 if has_vip_conflict else 0.0)
        - (total_ci * 0.1),
        2,
    )

    # 7. Generate Signed HMAC Token (15-minute expiration)
    simulation_id = uuid4()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    token_payload = {
        "simulation_id": str(simulation_id),
        "section_id": str(request.section_id),
        "target_date": request.target_date.isoformat(),
        "start_time": request.start_time.isoformat(),
        "end_time": request.end_time.isoformat(),
        "duration_minutes": proposed_duration_minutes,
        "maintenance_request_ids": [str(rid) for rid in request.maintenance_request_ids],
        "total_detention_minutes": total_detention_minutes,
        "conflicting_trains_count": len(conflicting_trains),
        "allow_slw_fallback": request.allow_slw_fallback,
        "expires_at": expires_at.isoformat(),
    }
    commit_token = _generate_commit_token(token_payload, settings.SECRET_KEY)

    return WhatIfSimulationResponse(
        simulation_id=simulation_id,
        is_feasible=is_feasible,
        has_vip_train_conflict=has_vip_conflict,
        detention_delta_minutes=total_detention_minutes,
        total_detention_minutes=total_detention_minutes,
        conflicting_trains_count=len(conflicting_trains),
        conflicting_trains=conflicting_trains,
        risk_score_delta=risk_delta,
        criticality_index_preserved_pct=ci_preserved_pct,
        shadow_efficiency_score=shadow_eff,
        slw_advisory_required=slw_advisory_req,
        commit_token=commit_token,
        expires_at=expires_at,
    )


# ── Endpoint 3: Commit Verified What-If Simulation ──────────


@router.post(
    "/commit-simulation",
    response_model=CommitSimulationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Commit Verified What-If Simulation to PostgreSQL",
)
async def commit_simulation(
    request: CommitSimulationRequest,
    db: AsyncSession = Depends(get_db),
) -> CommitSimulationResponse:
    """Verify cryptographically signed HMAC token and commit simulated block to DB.

    Creates `Block` and `BlockJob` records and updates `MaintenanceRequest` status
    to `SCHEDULED`.
    """
    # 1. Verify HMAC Token
    try:
        payload = _verify_commit_token(request.commit_token, settings.SECRET_KEY)
    except TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Simulation commit token has expired. Please re-run simulation.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid simulation commit token: {exc}",
        )

    # 2. Extract payload fields
    section_id = UUID(payload["section_id"])
    target_date = date.fromisoformat(payload["target_date"])
    start_time = time.fromisoformat(payload["start_time"])
    end_time = time.fromisoformat(payload["end_time"])
    duration_minutes = payload["duration_minutes"]
    req_ids = [UUID(rid) for rid in payload["maintenance_request_ids"]]

    # 3. Load section and maintenance requests
    sec_res = await db.execute(select(Section).where(Section.id == section_id))
    section = sec_res.scalar_one_or_none()
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Section {section_id} not found.",
        )

    req_res = await db.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id.in_(req_ids))
    )
    reqs = list(req_res.scalars().all())

    if not reqs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No matching maintenance requests found for commit.",
        )

    # 4. Create Block record
    block_id = uuid4()
    block_code = f"BLK-{target_date.strftime('%Y%m%d')}-{block_id.hex[:4].upper()}"
    primary_dept = reqs[0].department if reqs else "TRACK"
    participating_depts = list(set(r.department for r in reqs))

    total_ci = sum(compute_criticality_index(r, target_date) for r in reqs)

    db_block = Block(
        id=block_id,
        block_code=block_code,
        section_id=section_id,
        block_date=target_date,
        start_time=start_time,
        end_time=end_time,
        duration_minutes=duration_minutes,
        train_impact_count=int(payload.get("conflicting_trains_count", 0)),
        impact_score=total_ci,
        status="APPROVED" if request.approved_by else "PROPOSED",
        optimizer_metadata={
            "simulation_id": payload.get("simulation_id"),
            "approved_by": request.approved_by,
            "notes": request.notes,
            "is_joint_shadow_block": len(reqs) > 1,
            "primary_department": primary_dept,
            "participating_departments": participating_depts,
            "line_direction": "BOTH",
            "total_detention_minutes": payload.get("total_detention_minutes", 0),
        },
    )
    db.add(db_block)

    # 5. Create BlockJob records and update request statuses
    for seq_idx, req in enumerate(reqs, start=1):
        db_job = BlockJob(
            id=uuid4(),
            block_id=block_id,
            maintenance_request_id=req.id,
            sequence_order=seq_idx,
        )
        db.add(db_job)
        req.status = "SCHEDULED"

    await db.commit()

    return CommitSimulationResponse(
        success=True,
        message="Simulated block successfully committed to database.",
        block_id=block_id,
        block_code=block_code,
        committed_at=datetime.now(timezone.utc),
    )


# ── Endpoint 4: Real-Time Fast Rescheduling & SLW Fallback ──


@router.post(
    "/reschedule",
    response_model=RescheduleResponse,
    status_code=status.HTTP_200_OK,
    summary="Real-Time Fast Rescheduler & SLW Fallback",
)
async def reschedule_live_disruption(
    request: RescheduleRequest,
) -> RescheduleResponse:
    """Evaluate live train delay or maintenance overrun and apply greedy shift or SLW advisory.

    - Shifts block times in <1s for delays >20 mins without re-solving global CP-SAT model.
    - Absorbs delays <= 20 mins into statutory safety buffers.
    - Generates statutory Indian Railways G&SR Chapter 5/15 Single Line Working (SLW)
      emergency advisory for overruns (+15 mins) with queued passenger trains.
    """
    outcome = reschedule_on_disruption(
        active_block=request.active_block,
        delay_minutes=request.delay_minutes,
        impacted_train_number=request.impacted_train_number,
        impacted_train_name=request.impacted_train_name,
        impacted_train_priority=request.impacted_train_priority,
        impacted_train_type=request.impacted_train_type,
        is_block_overrun=request.is_block_overrun,
        has_queued_trains=request.has_queued_trains,
        parallel_line_available=request.parallel_line_available,
        line_type=request.line_type,
        section_code=request.section_code,
        section_name=request.section_name,
        division=request.division,
        zone=request.zone,
        queued_train_numbers=request.queued_train_numbers,
        freight_rakes_to_hold=request.freight_rakes_to_hold,
        pilot_train_number=request.pilot_train_number,
        private_number=request.private_number,
        reason=request.reason,
    )

    shifted_summary = (
        _to_scheduled_block_summary(outcome.shifted_block)
        if outcome.shifted_block
        else None
    )

    slw_schema = None
    if outcome.slw_advisory:
        slw_schema = SLWAdvisorySchema(
            advisory_id=outcome.slw_advisory.advisory_id,
            timestamp=outcome.slw_advisory.timestamp,
            gsr_rule_reference=outcome.slw_advisory.gsr_rule_reference,
            section_code=outcome.slw_advisory.section_code,
            section_name=outcome.slw_advisory.section_name,
            obstructed_line=outcome.slw_advisory.obstructed_line,
            single_line_in_use=outcome.slw_advisory.single_line_in_use,
            pilot_train_number=outcome.slw_advisory.pilot_train_number,
            pilot_train_name=outcome.slw_advisory.pilot_train_name,
            first_pilot_speed_kmph=outcome.slw_advisory.first_pilot_speed_kmph,
            subsequent_train_speed_kmph=outcome.slw_advisory.subsequent_train_speed_kmph,
            facing_points_speed_kmph=outcome.slw_advisory.facing_points_speed_kmph,
            freight_siding_orders=outcome.slw_advisory.freight_siding_orders,
            queued_train_priorities=outcome.slw_advisory.queued_train_priorities,
            private_number=outcome.slw_advisory.private_number,
            advisory_text=outcome.slw_advisory.advisory_text,
            td602_authority_sheet=outcome.slw_advisory.td602_authority_sheet,
            controller_phone_script=outcome.slw_advisory.controller_phone_script,
        )

    return RescheduleResponse(
        outcome_id=outcome.outcome_id,
        action_taken=RescheduleActionEnum(outcome.action_taken.value),
        success=outcome.success,
        delay_minutes=outcome.delay_minutes,
        is_block_overrun=outcome.is_block_overrun,
        has_queued_trains=outcome.has_queued_trains,
        original_start_time=outcome.original_start_time,
        original_end_time=outcome.original_end_time,
        new_start_time=outcome.new_start_time,
        new_end_time=outcome.new_end_time,
        original_start_datetime=outcome.original_start_datetime,
        original_end_datetime=outcome.original_end_datetime,
        new_start_datetime=outcome.new_start_datetime,
        new_end_datetime=outcome.new_end_datetime,
        shifted_block=shifted_summary,
        slw_advisory=slw_schema,
        affected_trains_count=outcome.affected_trains_count,
        execution_time_ms=outcome.execution_time_ms,
        reason=outcome.reason,
        advisory_notes=outcome.advisory_notes,
    )
