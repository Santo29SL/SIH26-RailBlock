"""Unit and integration tests for Google OR-Tools MILP block optimizer engine.

Stage 5 Test Suite for RailBlock (SIH PS 26027).

Covers:
- Basic solo block assignment
- Hard constraints (duration limit, section match, directional track line)
- Request uniqueness constraint across overlapping candidate blocks
- Single possession per corridor gap / section exclusivity
- Preference for Joint Shadow Blocks via alpha * ShadowHours reward
- Machine/equipment resource capacity limits across sections
- Tier 1 VIP train (Rajdhani/Vande Bharat) zero-detention hard constraint
- Solver timeout and fallback behavior
- End-to-end Stage 3 -> 4 -> 5 optimization pipeline
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

import pytest

from app.core.config import settings
from app.schemas.common import DepartmentEnum, LineTypeEnum, PriorityEnum, TrainPriorityEnum, TrainTypeEnum
from app.services.clustering import (
    CandidateShadowBlock,
    ShadowActivityAssignment,
    cluster_shadow_blocks,
)
from app.services.gap_extractor import CorridorGap, extract_corridor_gaps
from app.services.optimizer import (
    OptimizationResult,
    ScheduledBlock,
    run_optimization_pipeline,
    solve_block_schedule,
)


# ── Mock Classes for Testing ────────────────────────────────


@dataclass
class MockResource:
    """Mock Resource entity for testing resource capacity limits."""

    id: UUID
    resource_name: str
    department: str
    capacity: int = 1
    is_available: bool = True


@dataclass
class MockTrain:
    """Mock Train entity."""

    id: UUID
    train_number: str
    train_name: str
    train_type: TrainTypeEnum = TrainTypeEnum.EXPRESS
    priority: TrainPriorityEnum = TrainPriorityEnum.MEDIUM


@dataclass
class MockTrainMovement:
    """Mock TrainMovement entity."""

    id: UUID
    train_id: UUID
    section_id: UUID
    departure_time: time
    arrival_time: time
    day_of_week: int = 0
    line_direction: str = "UP"
    is_active: bool = True
    train: Optional[MockTrain] = None


@dataclass
class MockMaintenanceRequest:
    """Mock MaintenanceRequest entity."""

    id: UUID
    request_code: str
    section_id: UUID
    department: str
    activity_type: str
    duration_minutes: int
    priority: str = "MEDIUM"
    deadline: Optional[date] = None
    status: str = "PENDING"
    resource_id: Optional[UUID] = None
    metadata_json: Optional[Dict[str, Any]] = None


# ── Helper Fixture Generators ────────────────────────────────


def make_gap(
    section_id: UUID,
    start_h: int,
    start_m: int,
    duration_mins: int,
    target_date: Optional[date] = None,
    line_direction: str = "BOTH",
    has_vip: bool = False,
) -> CorridorGap:
    """Construct a synthetic CorridorGap for testing."""
    t_date = target_date or date(2026, 8, 25)
    s_time = time(start_h, start_m)
    s_dt = datetime.combine(t_date, s_time)
    e_dt = s_dt + timedelta(minutes=duration_mins)
    return CorridorGap(
        id=uuid4(),
        section_id=section_id,
        target_date=t_date,
        start_time=s_time,
        end_time=e_dt.time(),
        start_datetime=s_dt,
        end_datetime=e_dt,
        duration_minutes=duration_mins,
        line_direction=line_direction,
        safety_buffer_minutes=15,
        has_vip_train_proximity=has_vip,
    )


def make_candidate_block(
    section_id: UUID,
    duration_mins: int,
    department: DepartmentEnum = DepartmentEnum.TRACK,
    activity_name: str = "Machine Tamping",
    ci: float = 75.0,
    shadow_overlap_hours: float = 0.0,
    is_joint: bool = False,
    participating_depts: Optional[List[DepartmentEnum]] = None,
    resource_id: Optional[UUID] = None,
    covered_request_ids: Optional[List[UUID]] = None,
    line_direction: str = "BOTH",
) -> CandidateShadowBlock:
    """Construct a synthetic CandidateShadowBlock for testing."""
    prim_req_id = uuid4()
    req_ids = covered_request_ids or [prim_req_id]
    depts = participating_depts or [department]

    primary_activity = ShadowActivityAssignment(
        id=uuid4(),
        maintenance_request_id=prim_req_id,
        request_code=f"MR-{department.value}-001",
        department=department,
        activity_type=activity_name,
        duration_minutes=duration_mins,
        start_offset_minutes=0,
        end_offset_minutes=duration_mins,
        criticality_index=ci,
        is_primary=True,
        resource_id=resource_id,
    )

    activities = [primary_activity]
    # If joint, add secondary activity
    if is_joint and len(req_ids) > 1:
        for idx, sec_id in enumerate(req_ids[1:], start=2):
            sec_dept = depts[min(idx - 1, len(depts) - 1)]
            activities.append(
                ShadowActivityAssignment(
                    id=uuid4(),
                    maintenance_request_id=sec_id,
                    request_code=f"MR-{sec_dept.value}-00{idx}",
                    department=sec_dept,
                    activity_type="Secondary Shadow Activity",
                    duration_minutes=duration_mins - 30,
                    start_offset_minutes=15,
                    end_offset_minutes=duration_mins - 15,
                    criticality_index=50.0,
                    is_primary=False,
                    resource_id=None,
                )
            )

    return CandidateShadowBlock(
        id=uuid4(),
        section_id=section_id,
        primary_request_id=prim_req_id,
        primary_department=department,
        primary_activity=activity_name,
        duration_minutes=duration_mins,
        is_joint_shadow_block=is_joint,
        participating_departments=depts,
        total_criticality_index=ci,
        shadow_overlap_hours=shadow_overlap_hours,
        activities=activities,
        requests_covered_ids=req_ids,
        line_direction=line_direction,
    )


# ── Unit Tests ──────────────────────────────────────────────


def test_optimizer_empty_inputs():
    """Verify optimizer handles empty inputs gracefully without raising exceptions."""
    res_no_gaps = solve_block_schedule(gaps=[], candidate_blocks=[])
    assert res_no_gaps.is_feasible is True
    assert res_no_gaps.total_blocks_scheduled == 0
    assert res_no_gaps.solver_status == "OPTIMAL"

    sec_id = uuid4()
    gap = make_gap(sec_id, 1, 0, 120)
    res_no_blocks = solve_block_schedule(gaps=[gap], candidate_blocks=[])
    assert res_no_blocks.total_blocks_scheduled == 0
    assert res_no_blocks.solver_status == "OPTIMAL"

    block = make_candidate_block(sec_id, 90)
    res_no_gaps_with_blocks = solve_block_schedule(gaps=[], candidate_blocks=[block])
    assert res_no_gaps_with_blocks.total_blocks_scheduled == 0
    assert res_no_gaps_with_blocks.solver_status == "NO_SOLUTION"
    assert len(res_no_gaps_with_blocks.unassigned_request_ids) == len(block.requests_covered_ids)


def test_optimizer_single_block_assignment():
    """Test assigning a single candidate block to a compatible corridor gap."""
    sec_id = uuid4()
    target_date = date(2026, 8, 25)

    gap = make_gap(sec_id, 2, 0, 180, target_date=target_date)
    block = make_candidate_block(sec_id, 120, ci=80.0)

    result = solve_block_schedule(
        gaps=[gap],
        candidate_blocks=[block],
        target_date=target_date,
    )

    assert result.is_optimal is True
    assert result.solver_status == "OPTIMAL"
    assert result.total_blocks_scheduled == 1
    assert result.total_maintenance_requests_covered == 1
    assert result.total_unassigned_requests == 0
    assert result.total_criticality_index == 80.0
    assert len(result.scheduled_blocks) == 1

    scheduled = result.scheduled_blocks[0]
    assert scheduled.section_id == sec_id
    assert scheduled.start_time == time(2, 0)
    assert scheduled.end_time == time(4, 0)  # 2:00 + 120 mins = 4:00
    assert scheduled.duration_minutes == 120
    assert scheduled.corridor_gap_id == gap.id


def test_optimizer_duration_hard_constraint():
    """Test that a block cannot be assigned to a gap shorter than the block duration."""
    sec_id = uuid4()
    gap = make_gap(sec_id, 1, 0, 60)  # 60 min gap
    block = make_candidate_block(sec_id, 90)  # 90 min required duration

    result = solve_block_schedule(gaps=[gap], candidate_blocks=[block])

    assert result.total_blocks_scheduled == 0
    assert result.solver_status == "NO_SOLUTION"
    assert len(result.unassigned_request_ids) == 1


def test_optimizer_section_match_hard_constraint():
    """Test that a block on Section A cannot be scheduled in a gap on Section B."""
    sec_a = uuid4()
    sec_b = uuid4()

    gap_b = make_gap(sec_b, 1, 0, 180)
    block_a = make_candidate_block(sec_a, 120)

    result = solve_block_schedule(gaps=[gap_b], candidate_blocks=[block_a])

    assert result.total_blocks_scheduled == 0
    assert result.solver_status == "NO_SOLUTION"
    assert len(result.unassigned_request_ids) == 1


def test_optimizer_request_uniqueness_constraint():
    """Test that overlapping candidate blocks covering the same request are not double-scheduled."""
    sec_id = uuid4()
    gap1 = make_gap(sec_id, 1, 0, 120)
    gap2 = make_gap(sec_id, 4, 0, 120)

    req_r1 = uuid4()
    req_r2 = uuid4()

    # Candidate 1: Solo R1 (CI 50)
    block_solo_1 = make_candidate_block(sec_id, 90, ci=50.0, covered_request_ids=[req_r1])
    # Candidate 2: Solo R2 (CI 40)
    block_solo_2 = make_candidate_block(sec_id, 90, ci=40.0, covered_request_ids=[req_r2])
    # Candidate 3: Joint R1 + R2 (CI 90, 1.5 shadow hours)
    block_joint = make_candidate_block(
        sec_id,
        100,
        ci=90.0,
        shadow_overlap_hours=1.5,
        is_joint=True,
        participating_depts=[DepartmentEnum.TRACK, DepartmentEnum.SIGNAL],
        covered_request_ids=[req_r1, req_r2],
    )

    result = solve_block_schedule(
        gaps=[gap1, gap2],
        candidate_blocks=[block_solo_1, block_solo_2, block_joint],
        alpha_shadow=1.5,
    )

    assert result.is_optimal is True
    # The joint block covers both R1 and R2 in gap1, and neither solo_1 nor solo_2 is scheduled in gap2!
    assert result.total_blocks_scheduled == 1
    assert result.scheduled_blocks[0].is_joint_shadow_block is True
    assert result.total_maintenance_requests_covered == 2
    assert result.total_unassigned_requests == 0


def test_optimizer_gap_exclusivity():
    """Test that at most one block is assigned per corridor gap."""
    sec_id = uuid4()
    gap = make_gap(sec_id, 1, 0, 180)

    req1 = uuid4()
    req2 = uuid4()
    block1 = make_candidate_block(sec_id, 60, ci=70.0, covered_request_ids=[req1])
    block2 = make_candidate_block(sec_id, 60, ci=60.0, covered_request_ids=[req2])

    result = solve_block_schedule(gaps=[gap], candidate_blocks=[block1, block2])

    assert result.is_optimal is True
    assert result.total_blocks_scheduled == 1
    # Higher CI block (block1 with 70) should be scheduled
    scheduled = result.scheduled_blocks[0]
    assert scheduled.total_criticality_index == 70.0
    assert req1 in scheduled.requests_covered_ids
    assert req2 in result.unassigned_request_ids


def test_optimizer_joint_shadow_block_preference():
    """Verify solver prefers Joint Shadow Block due to alpha * ShadowHours reward."""
    sec_id = uuid4()
    gap = make_gap(sec_id, 1, 0, 240)

    req1 = uuid4()
    req2 = uuid4()
    req3 = uuid4()

    # Solo block for req1
    block_solo = make_candidate_block(sec_id, 120, ci=60.0, covered_request_ids=[req1])

    # Joint block for req1 + req2 + req3 (CI 150, 3.0 shadow hours)
    block_joint = make_candidate_block(
        sec_id,
        150,
        ci=150.0,
        shadow_overlap_hours=3.0,
        is_joint=True,
        participating_depts=[DepartmentEnum.TRACK, DepartmentEnum.SIGNAL, DepartmentEnum.TRACTION],
        covered_request_ids=[req1, req2, req3],
    )

    result = solve_block_schedule(
        gaps=[gap],
        candidate_blocks=[block_solo, block_joint],
        alpha_shadow=1.5,
    )

    assert result.is_optimal is True
    assert result.total_blocks_scheduled == 1
    scheduled = result.scheduled_blocks[0]
    assert scheduled.is_joint_shadow_block is True
    assert scheduled.shadow_overlap_hours == 3.0
    assert result.total_shadow_overlap_hours == 3.0
    assert result.total_maintenance_requests_covered == 3


def test_optimizer_resource_capacity_limit_across_sections():
    """Test machine resource capacity limits across different sections at concurrent times."""
    sec_a = uuid4()
    sec_b = uuid4()

    # Shared track machine (Tamping Machine 01) with capacity = 1
    tamping_machine = MockResource(
        id=uuid4(),
        resource_name="Tamping Machine 01",
        department="TRACK",
        capacity=1,
    )

    # Overlapping corridor gaps on Section A and Section B (01:00 to 04:00)
    gap_a = make_gap(sec_a, 1, 0, 180)
    gap_b = make_gap(sec_b, 1, 30, 180)

    req_a = uuid4()
    req_b = uuid4()

    block_a = make_candidate_block(
        sec_a,
        120,
        ci=90.0,
        resource_id=tamping_machine.id,
        covered_request_ids=[req_a],
    )
    block_b = make_candidate_block(
        sec_b,
        120,
        ci=70.0,
        resource_id=tamping_machine.id,
        covered_request_ids=[req_b],
    )

    result = solve_block_schedule(
        gaps=[gap_a, gap_b],
        candidate_blocks=[block_a, block_b],
        resources=[tamping_machine],
    )

    assert result.is_optimal is True
    # Since capacity is 1 and gaps overlap, solver can only schedule 1 block
    assert result.total_blocks_scheduled == 1
    # Higher CI block (block_a with 90.0) must be scheduled
    assert result.scheduled_blocks[0].section_id == sec_a
    assert result.total_criticality_index == 90.0
    assert req_b in result.unassigned_request_ids


def test_optimizer_resource_capacity_allows_higher_capacity():
    """Test that a resource with capacity=2 allows two concurrent overlapping blocks."""
    sec_a = uuid4()
    sec_b = uuid4()

    heavy_crane = MockResource(
        id=uuid4(),
        resource_name="Heavy Crane Fleet",
        department="TRACTION",
        capacity=2,
    )

    gap_a = make_gap(sec_a, 1, 0, 180)
    gap_b = make_gap(sec_b, 1, 30, 180)

    block_a = make_candidate_block(sec_a, 120, ci=80.0, resource_id=heavy_crane.id)
    block_b = make_candidate_block(sec_b, 120, ci=70.0, resource_id=heavy_crane.id)

    result = solve_block_schedule(
        gaps=[gap_a, gap_b],
        candidate_blocks=[block_a, block_b],
        resources=[heavy_crane],
    )

    assert result.is_optimal is True
    # Capacity is 2, so both can be scheduled simultaneously
    assert result.total_blocks_scheduled == 2
    assert result.total_criticality_index == 150.0


def test_optimizer_resource_unavailable():
    """Test that an unavailable resource (is_available=False) prevents scheduling."""
    sec_id = uuid4()
    gap = make_gap(sec_id, 1, 0, 180)

    broken_machine = MockResource(
        id=uuid4(),
        resource_name="Broken Tamping Machine",
        department="TRACK",
        capacity=1,
        is_available=False,
    )

    block = make_candidate_block(sec_id, 120, ci=85.0, resource_id=broken_machine.id)

    result = solve_block_schedule(
        gaps=[gap],
        candidate_blocks=[block],
        resources=[broken_machine],
    )

    assert result.total_blocks_scheduled == 0
    assert len(result.unassigned_request_ids) == 1


def test_optimizer_tier1_vip_zero_detention():
    """Test ADR 0003 Tier 1 VIP zero-detention hard constraint.

    If a corridor gap borders a VIP train and the block duration would exceed the safe
    gap window (causing detention), it is rejected under the zero-detention hard constraint.
    """
    sec_id = uuid4()
    # Gap of 100 minutes bordered by Rajdhani Express (has_vip=True)
    gap_vip = make_gap(sec_id, 2, 0, 100, has_vip=True)

    # Block requiring 120 minutes (exceeds gap by 20 mins)
    block_overrun = make_candidate_block(sec_id, 120, ci=95.0)

    # Normal gap of 150 mins
    gap_normal = make_gap(sec_id, 6, 0, 150, has_vip=False)

    result = solve_block_schedule(
        gaps=[gap_vip, gap_normal],
        candidate_blocks=[block_overrun],
    )

    assert result.is_optimal is True
    assert result.total_blocks_scheduled == 1
    # Must be scheduled in the normal gap, not encroaching on the VIP gap
    assert result.scheduled_blocks[0].corridor_gap_id == gap_normal.id
    assert result.total_train_detention_minutes == 0


def test_optimizer_timeout_fallback():
    """Verify solver respects max_solver_time_seconds parameter and returns valid result."""
    sec_id = uuid4()
    gap = make_gap(sec_id, 1, 0, 180)
    block = make_candidate_block(sec_id, 120, ci=80.0)

    result = solve_block_schedule(
        gaps=[gap],
        candidate_blocks=[block],
        max_solver_time_seconds=5,
    )

    assert result.is_feasible is True
    assert result.total_blocks_scheduled == 1
    assert result.solver_execution_time_ms < 5000.0


def test_optimizer_to_dict_methods():
    """Verify serialization to standard dictionaries."""
    sec_id = uuid4()
    gap = make_gap(sec_id, 1, 0, 180)
    block = make_candidate_block(sec_id, 120, ci=80.0, is_joint=True, shadow_overlap_hours=1.5)

    result = solve_block_schedule(gaps=[gap], candidate_blocks=[block])
    res_dict = result.to_dict()

    assert "run_id" in res_dict
    assert res_dict["solver_status"] == "OPTIMAL"
    assert res_dict["total_blocks_scheduled"] == 1
    assert len(res_dict["scheduled_blocks"]) == 1

    blk_dict = res_dict["scheduled_blocks"][0]
    assert blk_dict["section_id"] == str(sec_id)
    assert blk_dict["duration_minutes"] == 120
    assert blk_dict["is_joint_shadow_block"] is True
    assert blk_dict["shadow_overlap_hours"] == 1.5


def test_end_to_end_optimization_pipeline():
    """Test full end-to-end Stage 3 -> Stage 4 -> Stage 5 optimization pipeline."""
    sec_id = uuid4()
    t_date = date(2026, 8, 25)

    # 1. Create Timetabled Train Movements
    # Train 1: 06:00 to 06:30
    # Train 2: 12:00 to 12:30
    # Train 3: 18:00 to 18:30
    # Yields gaps: 00:00-05:45 (345 mins), 06:45-11:45 (300 mins), 12:45-17:45 (300 mins), 18:45-24:00 (315 mins)
    m1 = MockTrainMovement(
        id=uuid4(),
        train_id=uuid4(),
        section_id=sec_id,
        departure_time=time(6, 0),
        arrival_time=time(6, 30),
        day_of_week=t_date.weekday(),
    )
    m2 = MockTrainMovement(
        id=uuid4(),
        train_id=uuid4(),
        section_id=sec_id,
        departure_time=time(12, 0),
        arrival_time=time(12, 30),
        day_of_week=t_date.weekday(),
    )
    m3 = MockTrainMovement(
        id=uuid4(),
        train_id=uuid4(),
        section_id=sec_id,
        departure_time=time(18, 0),
        arrival_time=time(18, 30),
        day_of_week=t_date.weekday(),
    )

    # 2. Create Maintenance Requests across 3 departments
    req_track = MockMaintenanceRequest(
        id=uuid4(),
        request_code="MR-TRK-001",
        section_id=sec_id,
        department="TRACK",
        activity_type="Machine Tamping",
        duration_minutes=120,
        priority="HIGH",
        metadata_json={"chainage_km": 15.0},
    )
    req_signal = MockMaintenanceRequest(
        id=uuid4(),
        request_code="MR-SIG-001",
        section_id=sec_id,
        department="SIGNAL",
        activity_type="Signal Cable Replacement",
        duration_minutes=90,
        priority="MEDIUM",
        metadata_json={"chainage_km": 15.2},
    )
    req_traction = MockMaintenanceRequest(
        id=uuid4(),
        request_code="MR-TRD-001",
        section_id=sec_id,
        department="TRACTION",
        activity_type="Insulator Cleaning/Replacement",
        duration_minutes=60,
        priority="LOW",
        metadata_json={"chainage_km": 15.5},
    )

    # 3. Run complete optimization pipeline
    pipeline_result = run_optimization_pipeline(
        movements=[m1, m2, m3],
        requests=[req_track, req_signal, req_traction],
        target_date=t_date,
        section_id=sec_id,
        section_code_map={sec_id: "MAS-AJJ"},
    )

    assert pipeline_result.is_feasible is True
    assert pipeline_result.total_blocks_scheduled >= 1
    assert pipeline_result.total_maintenance_requests_covered == 3
    assert pipeline_result.total_unassigned_requests == 0
    assert pipeline_result.total_shadow_overlap_hours > 0.0

    # Verify scheduled block structure
    for blk in pipeline_result.scheduled_blocks:
        assert blk.section_code == "MAS-AJJ"
        assert blk.duration_minutes >= 60
        assert len(blk.activities) >= 1


def test_pipeline_uses_ml_criticality_before_optimization(monkeypatch):
    """Stage 2 prediction must become the CI used by clustering and CP-SAT."""
    section_id = uuid4()
    target = date(2026, 8, 25)
    request = MockMaintenanceRequest(
        id=uuid4(),
        request_code="MR-TRK-ML-001",
        section_id=section_id,
        department="TRACK",
        activity_type="RAIL_RENEWAL_USFD",
        duration_minutes=60,
        priority="LOW",
        metadata_json={"tgi_deviation": 85.0, "usfd_flaw_severity": 3},
    )

    def fake_predict(_request, target_date=None):
        assert target_date == target
        return {
            "criticality_index": 93.5,
            "model_used": "xgboost_shap_v1",
            "shap_explanation": {
                "base_value": 34.0,
                "feature_attributions": {"USFD Ultrasonic Rail Flaw": 40.0},
                "human_readable_reasoning": "Critical USFD defect.",
            },
        }

    monkeypatch.setattr("app.services.optimizer.risk_engine.predict_risk", fake_predict)
    result = run_optimization_pipeline(
        movements=[],
        requests=[request],
        target_date=target,
        section_id=section_id,
        min_gap_minutes=60,
    )

    assert result.total_blocks_scheduled == 1
    assert result.total_criticality_index == pytest.approx(93.5)
    assert result.scheduled_blocks[0].activities[0].criticality_index == pytest.approx(93.5)
    assert request.metadata_json["criticality_source"] == "ml_risk_engine"
    assert request.metadata_json["criticality_model"] == "xgboost_shap_v1"
    assert result.metadata["risk_scoring"]["ml_scored"] == 1


def test_pipeline_preserves_explicit_criticality(monkeypatch):
    """Trusted upstream CI values must not be overwritten by the ML engine."""
    section_id = uuid4()
    request = MockMaintenanceRequest(
        id=uuid4(),
        request_code="MR-SIG-EXPLICIT-001",
        section_id=section_id,
        department="SIGNAL",
        activity_type="POINT_MACHINE_TEST",
        duration_minutes=60,
        metadata_json={"criticality_index": 77.0, "point_failure_risk": 90.0},
    )

    def unexpected_predict(*args, **kwargs):
        pytest.fail("Explicit scores must bypass ML inference")

    monkeypatch.setattr("app.services.optimizer.risk_engine.predict_risk", unexpected_predict)
    result = run_optimization_pipeline(
        movements=[],
        requests=[request],
        target_date=date(2026, 8, 25),
        section_id=section_id,
        min_gap_minutes=60,
    )

    assert result.total_criticality_index == pytest.approx(77.0)
    assert result.metadata["risk_scoring"]["explicit_scores_preserved"] == 1
