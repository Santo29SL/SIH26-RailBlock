"""Unit tests for optimizer schemas, What-If simulations, statutory exports, and config."""

from __future__ import annotations

import uuid
from datetime import date, datetime, time, timezone

import pytest
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.common import (
    BlockStatusEnum,
    DepartmentEnum,
    TrainPriorityEnum,
    TrainTypeEnum,
)
from app.schemas.optimizer import (
    BDMSExportPayload,
    BDMSShadowActivity,
    CommitSimulationRequest,
    CommitSimulationResponse,
    ConflictingTrainImpact,
    DetentionTierEnum,
    FormT351NoticePayload,
    OptimizerRunRequest,
    OptimizerRunResponse,
    ScheduledBlockJobSummary,
    ScheduledBlockSummary,
    WhatIfSimulationRequest,
    WhatIfSimulationResponse,
)


# ── 1. Config Parameter Tests ────────────────────────────


def test_optimizer_config_defaults():
    """Verify application settings contain domain-accurate defaults."""
    assert settings.DEFAULT_SAFETY_BUFFER_MINUTES == 15
    assert settings.DEFAULT_MIN_GAP_MINUTES == 60
    assert settings.SOLVER_ALPHA_SHADOW_WEIGHT == 1.5
    assert settings.SOLVER_BETA_DETENTION_WEIGHT == 0.8
    assert settings.SOLVER_TIMEOUT_SECONDS == 30

    # Fallback Criticality Index weights
    assert settings.CRITICALITY_WEIGHT_TGI == 0.35
    assert settings.CRITICALITY_WEIGHT_TSR == 0.25
    assert settings.CRITICALITY_WEIGHT_OVERDUE == 0.20
    assert settings.CRITICALITY_WEIGHT_GMT == 0.20
    assert (
        settings.CRITICALITY_WEIGHT_TGI
        + settings.CRITICALITY_WEIGHT_TSR
        + settings.CRITICALITY_WEIGHT_OVERDUE
        + settings.CRITICALITY_WEIGHT_GMT
    ) == pytest.approx(1.0)


# ── 2. Optimizer Run Schemas Tests ───────────────────────


def test_optimizer_run_request_valid():
    """Test valid OptimizerRunRequest instantiation with defaults and explicit values."""
    sec_id = uuid.uuid4()
    req = OptimizerRunRequest(
        target_date=date(2026, 8, 25),
        section_ids=[sec_id],
        horizon_days=3,
        safety_buffer_minutes=15,
        min_gap_minutes=60,
        alpha_shadow_weight=1.5,
        beta_detention_weight=0.8,
        solver_timeout_seconds=30,
        persist_to_db=True,
    )
    assert req.target_date == date(2026, 8, 25)
    assert req.section_ids == [sec_id]
    assert req.horizon_days == 3
    assert req.persist_to_db is True


def test_optimizer_run_request_validation_failures():
    """Test validation constraints on OptimizerRunRequest."""
    # Invalid horizon_days (>30)
    with pytest.raises(ValidationError):
        OptimizerRunRequest(target_date=date(2026, 8, 25), horizon_days=31)

    # Invalid horizon_days (<1)
    with pytest.raises(ValidationError):
        OptimizerRunRequest(target_date=date(2026, 8, 25), horizon_days=0)

    # Negative safety_buffer_minutes
    with pytest.raises(ValidationError):
        OptimizerRunRequest(
            target_date=date(2026, 8, 25), safety_buffer_minutes=-5
        )

    # min_gap_minutes < 15
    with pytest.raises(ValidationError):
        OptimizerRunRequest(target_date=date(2026, 8, 25), min_gap_minutes=10)


def test_optimizer_run_response_serialization():
    """Test full serialization of OptimizerRunResponse with nested summaries."""
    run_id = uuid.uuid4()
    sec_id = uuid.uuid4()
    req_id = uuid.uuid4()

    job = ScheduledBlockJobSummary(
        maintenance_request_id=req_id,
        request_code="MR-TRK-001",
        department=DepartmentEnum.TRACK,
        activity_type="Machine Tamping",
        duration_minutes=120,
        start_offset_minutes=0,
        end_offset_minutes=120,
        criticality_index=85.5,
        is_primary=True,
    )

    block = ScheduledBlockSummary(
        block_code="BLK-20260825-001",
        section_id=sec_id,
        section_code="MAS-AJJ",
        block_date=date(2026, 8, 25),
        start_time=time(1, 30),
        end_time=time(3, 30),
        duration_minutes=120,
        is_joint_shadow_block=False,
        primary_department=DepartmentEnum.TRACK,
        participating_departments=[DepartmentEnum.TRACK],
        total_criticality_index=85.5,
        shadow_overlap_hours=0.0,
        estimated_train_detention_minutes=0,
        status=BlockStatusEnum.PROPOSED,
        jobs=[job],
    )

    resp = OptimizerRunResponse(
        run_id=run_id,
        target_date=date(2026, 8, 25),
        solver_status="OPTIMAL",
        total_blocks_scheduled=1,
        total_maintenance_requests_covered=1,
        total_unassigned_requests=0,
        total_shadow_overlap_hours=0.0,
        total_train_detention_minutes=0,
        total_criticality_index=85.5,
        objective_value=128.25,
        solver_execution_time_ms=245.5,
        scheduled_blocks=[block],
        unassigned_request_ids=[],
    )

    data = resp.model_dump()
    assert data["solver_status"] == "OPTIMAL"
    assert data["total_criticality_index"] == 85.5
    assert len(data["scheduled_blocks"]) == 1
    assert data["scheduled_blocks"][0]["block_code"] == "BLK-20260825-001"
    assert data["scheduled_blocks"][0]["jobs"][0]["activity_type"] == "Machine Tamping"


# ── 3. What-If Simulation Schemas Tests ───────────────────


def test_what_if_simulation_request_and_response():
    """Test What-If simulation request and response validation."""
    sec_id = uuid.uuid4()
    req_id = uuid.uuid4()
    train_id = uuid.uuid4()

    req = WhatIfSimulationRequest(
        simulation_name="Shift Morning Possessions",
        section_id=sec_id,
        target_date=date(2026, 8, 25),
        start_time=time(2, 0),
        end_time=time(4, 0),
        maintenance_request_ids=[req_id],
        allow_slw_fallback=True,
    )
    assert req.start_time == time(2, 0)
    assert req.allow_slw_fallback is True

    train_conflict = ConflictingTrainImpact(
        train_id=train_id,
        train_number="12621",
        train_name="Tamil Nadu Express",
        train_type=TrainTypeEnum.SUPERFAST,
        priority=TrainPriorityEnum.HIGH,
        scheduled_departure=time(2, 15),
        scheduled_arrival=time(2, 45),
        expected_detention_minutes=15,
        detention_penalty_tier=DetentionTierEnum.TIER_2_EXPRESS,
        is_hard_conflict=False,
    )

    sim_id = uuid.uuid4()
    resp = WhatIfSimulationResponse(
        simulation_id=sim_id,
        is_feasible=True,
        has_vip_train_conflict=False,
        detention_delta_minutes=15,
        total_detention_minutes=15,
        conflicting_trains_count=1,
        conflicting_trains=[train_conflict],
        risk_score_delta=-12.5,
        criticality_index_preserved_pct=95.0,
        shadow_efficiency_score=1.2,
        slw_advisory_required=False,
        commit_token="hmac_signed_token_mas_20260825_001",
        expires_at=datetime(2026, 8, 25, 12, 0, 0, tzinfo=timezone.utc),
    )

    assert resp.is_feasible is True
    assert resp.commit_token == "hmac_signed_token_mas_20260825_001"
    assert len(resp.conflicting_trains) == 1
    assert resp.conflicting_trains[0].train_number == "12621"
    assert resp.conflicting_trains[0].detention_penalty_tier == DetentionTierEnum.TIER_2_EXPRESS


def test_commit_simulation_request_and_response():
    """Test CommitSimulationRequest and CommitSimulationResponse."""
    block_id = uuid.uuid4()
    req = CommitSimulationRequest(
        commit_token="hmac_signed_token_mas_20260825_001",
        approved_by="Sr. DOM / Operations / MAS",
        notes="Approved during morning coordination conference",
    )
    assert req.approved_by == "Sr. DOM / Operations / MAS"

    resp = CommitSimulationResponse(
        success=True,
        message="Simulated schedule successfully committed to production database.",
        block_id=block_id,
        block_code="BLK-20260825-102",
        committed_at=datetime.now(timezone.utc),
    )
    assert resp.success is True
    assert resp.block_code == "BLK-20260825-102"


# ── 4. Statutory Export Schemas Tests ─────────────────────


def test_bdms_export_payload():
    """Test CRIS BDMS JSON export schema."""
    shadow = BDMSShadowActivity(
        request_code="MR-SIG-004",
        department=DepartmentEnum.SIGNAL,
        activity_type="Point Machine Testing",
        start_offset_minutes=15,
        duration_minutes=60,
        criticality_index=72.0,
        resources_required=["Signal Inspection Kit"],
    )

    bdms = BDMSExportPayload(
        bdms_message_id="BDMS-20260825-MAS-001",
        message_version="1.0",
        timestamp=datetime.now(timezone.utc),
        division="Chennai",
        zone="Southern Railway",
        section_code="MAS-AJJ",
        section_name="Chennai Central - Arakkonam",
        block_code="BLK-20260825-001",
        block_type="JOINT_SHADOW",
        line_direction="UP",
        block_date=date(2026, 8, 25),
        granted_start_time=time(1, 30),
        granted_end_time=time(4, 0),
        total_duration_minutes=150,
        primary_department=DepartmentEnum.TRACK,
        participating_departments=[DepartmentEnum.TRACK, DepartmentEnum.SIGNAL],
        traction_power_isolation=True,
        feeding_post_section="FP-KOK-SP-TRL",
        tsr_imposed=True,
        tsr_speed_kmph=30,
        demanding_official="Sr. DEN/Track/MAS",
        authorizing_controller="CPRC/Control/MAS",
        primary_activity="Machine Tamping",
        shadow_activities=[shadow],
        status="PROPOSED",
    )

    data = bdms.model_dump()
    assert data["bdms_message_id"] == "BDMS-20260825-MAS-001"
    assert data["primary_department"] == "TRACK"
    assert data["participating_departments"] == ["TRACK", "SIGNAL"]
    assert data["traction_power_isolation"] is True
    assert data["feeding_post_section"] == "FP-KOK-SP-TRL"
    assert data["tsr_speed_kmph"] == 30
    assert len(data["shadow_activities"]) == 1


def test_form_t351_notice_payload():
    """Test statutory Form T/351 Disconnection and Reconnection notice schema."""
    notice = FormT351NoticePayload(
        form_type="T/351",
        notice_number="T351/MAS/2026/0825/01",
        station_code="MAS",
        section_code="MAS-AJJ",
        date=date(2026, 8, 25),
        disconnection_time=time(1, 30),
        line_affected="Up Main Line",
        work_nature="Deep Screening and Machine Tamping between KM 142.0 and 145.0",
        department=DepartmentEnum.TRACK,
        disconnection_private_number="PN-4821",
        station_master_name="R. K. Sharma",
        field_engineer_name="P. V. Nair",
        field_engineer_designation="SSE/Permanent Way/MAS",
        reconnection_private_number="PN-4899",
        reconnection_time=time(4, 0),
        tsr_imposed=True,
        tsr_speed_kmph=45,
        remarks="Track restored with 45 km/h caution order for 24 hours.",
        status="RECONNECTED",
    )

    data = notice.model_dump()
    assert data["form_type"] == "T/351"
    assert data["disconnection_private_number"] == "PN-4821"
    assert data["reconnection_private_number"] == "PN-4899"
    assert data["tsr_imposed"] is True
    assert data["tsr_speed_kmph"] == 45
    assert data["status"] == "RECONNECTED"
