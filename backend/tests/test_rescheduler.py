"""Unit tests for Real-Time Fast Rescheduler and Single Line Working (SLW) Fallback.

Tests all acceptance criteria for Ticket 05:
1. `reschedule_on_disruption()` signature, inputs, and `RescheduleOutcome` frozen dataclass output.
2. Fast greedy time-shifting (<1 second) for train delays >20 minutes without global CP-SAT re-solving.
3. Internal shadow activity offset and duration preservation during time shifts.
4. Statutory safety buffer absorption (<=20 minute delays) without window shifts.
5. G&SR Chapter 5/15 Single Line Working (SLW) emergency advisory generation for block overruns (+15 min) with queued trains.
6. Statutory SLW advisory structure (pilot train dispatch, speed limits 25/15/40 km/h, freight siding regulation, SM Private Number).
7. Block overrun without queued trains (overrun warning).
8. Single line track topology (section blockade).
9. Polymorphic input compatibility: ScheduledBlock, ScheduledBlockSummary, and raw dictionaries.
10. Midnight date rollover handling.
11. Immutability of frozen dataclasses.
12. Sub-millisecond performance benchmarks.
"""

from __future__ import annotations

import time as _time
from dataclasses import FrozenInstanceError
from datetime import date, datetime, time, timedelta
from typing import List
from uuid import UUID, uuid4

import pytest

from app.schemas.common import (
    BlockStatusEnum,
    DepartmentEnum,
    LineTypeEnum,
    TrainPriorityEnum,
    TrainTypeEnum,
)
from app.schemas.optimizer import ScheduledBlockJobSummary, ScheduledBlockSummary
from app.schemas.rescheduler import (
    RescheduleActionEnum,
    RescheduleRequest,
    RescheduleResponse,
    SLWAdvisorySchema,
)
from app.services.clustering import ShadowActivityAssignment
from app.services.optimizer import ScheduledBlock
from app.services.rescheduler import (
    GSR_SLW_RULE_REFERENCE,
    SLW_FACING_POINTS_MAX_SPEED_KMPH,
    SLW_FIRST_PILOT_MAX_SPEED_KMPH,
    SLW_SUBSEQUENT_MAX_SPEED_KMPH,
    RescheduleAction,
    RescheduleOutcome,
    SLWAdvisory,
    ScheduledBlockPlan,
    apply_greedy_time_shift,
    format_slw_advisory_text,
    generate_controller_phone_script,
    generate_slw_advisory,
    generate_td602_authority_sheet,
    reschedule_on_disruption,
)


# ── Fixtures ─────────────────────────────────────────────────


@pytest.fixture
def sample_scheduled_block() -> ScheduledBlock:
    """Fixture providing a standard 120-minute ScheduledBlock with 2 shadow activities."""
    target_d = date(2026, 8, 25)
    start_dt = datetime(2026, 8, 25, 10, 0, 0)
    end_dt = datetime(2026, 8, 25, 12, 0, 0)
    req1_id = uuid4()
    req2_id = uuid4()

    act1 = ShadowActivityAssignment(
        maintenance_request_id=req1_id,
        request_code="MR-TRK-001",
        department=DepartmentEnum.TRACK,
        activity_type="Machine Tamping",
        start_offset_minutes=0,
        end_offset_minutes=120,
        duration_minutes=120,
        criticality_index=85.0,
        is_primary=True,
    )
    act2 = ShadowActivityAssignment(
        maintenance_request_id=req2_id,
        request_code="MR-SIG-002",
        department=DepartmentEnum.SIGNAL,
        activity_type="Signal Cable Replacement",
        start_offset_minutes=15,
        end_offset_minutes=75,
        duration_minutes=60,
        criticality_index=60.0,
        is_primary=False,
    )

    return ScheduledBlock(
        id=uuid4(),
        candidate_block_id=uuid4(),
        corridor_gap_id=uuid4(),
        section_id=uuid4(),
        section_code="MAS-AJJ",
        block_date=target_d,
        start_time=time(10, 0),
        end_time=time(12, 0),
        start_datetime=start_dt,
        end_datetime=end_dt,
        duration_minutes=120,
        is_joint_shadow_block=True,
        primary_department=DepartmentEnum.TRACK,
        participating_departments=[DepartmentEnum.TRACK, DepartmentEnum.SIGNAL],
        total_criticality_index=145.0,
        shadow_overlap_hours=1.0,
        estimated_train_detention_minutes=0,
        activities=[act1, act2],
        requests_covered_ids=[req1_id, req2_id],
        line_direction="UP",
        traction_power_isolation=False,
        feeding_post_section=None,
        status=BlockStatusEnum.PROPOSED,
        block_code="BLK-20260825-001",
        optimizer_metadata={"solver_mode": "CP-SAT"},
    )


@pytest.fixture
def sample_block_summary() -> ScheduledBlockSummary:
    """Fixture providing a ScheduledBlockSummary Pydantic model."""
    req1 = uuid4()
    req2 = uuid4()
    return ScheduledBlockSummary(
        id=uuid4(),
        block_code="BLK-20260825-002",
        section_id=uuid4(),
        section_code="MAS-AJJ",
        block_date=date(2026, 8, 25),
        start_time=time(14, 0),
        end_time=time(16, 30),
        duration_minutes=150,
        is_joint_shadow_block=True,
        primary_department=DepartmentEnum.TRACK,
        participating_departments=[DepartmentEnum.TRACK, DepartmentEnum.TRACTION],
        total_criticality_index=120.0,
        shadow_overlap_hours=1.5,
        estimated_train_detention_minutes=10,
        status=BlockStatusEnum.PROPOSED,
        jobs=[
            ScheduledBlockJobSummary(
                maintenance_request_id=req1,
                request_code="MR-TRK-010",
                department=DepartmentEnum.TRACK,
                activity_type="Deep Screening",
                duration_minutes=150,
                start_offset_minutes=0,
                end_offset_minutes=150,
                criticality_index=75.0,
                is_primary=True,
            ),
            ScheduledBlockJobSummary(
                maintenance_request_id=req2,
                request_code="MR-TRC-005",
                department=DepartmentEnum.TRACTION,
                activity_type="Pantograph Clearance Check",
                duration_minutes=90,
                start_offset_minutes=30,
                end_offset_minutes=120,
                criticality_index=45.0,
                is_primary=False,
            ),
        ],
    )


# ── Test Suite ───────────────────────────────────────────────


def test_type_alias_compatibility():
    """Verify ScheduledBlockPlan is an alias/compatible with ScheduledBlock."""
    assert ScheduledBlockPlan is ScheduledBlock


def test_reschedule_delay_over_20_minutes(sample_scheduled_block: ScheduledBlock):
    """AC: For train delays > 20 minutes, shift block start/end times in <1 second without global MILP re-solve."""
    t0 = _time.perf_counter()
    outcome = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=35,
        impacted_train_number="12621",
        impacted_train_name="Tamil Nadu Express",
        impacted_train_priority=TrainPriorityEnum.HIGH,
        is_block_overrun=False,
        has_queued_trains=False,
    )
    elapsed = _time.perf_counter() - t0

    assert elapsed < 1.0  # Must be strictly under 1 second SLA
    assert outcome.success is True
    assert outcome.action_taken == RescheduleAction.TIME_SHIFT.value
    assert outcome.delay_minutes == 35
    assert outcome.is_block_overrun is False

    # Original times unchanged in metadata
    assert outcome.original_start_time == time(10, 0)
    assert outcome.original_end_time == time(12, 0)

    # Shifted times: 10:00 + 35m -> 10:35, 12:00 + 35m -> 12:35
    assert outcome.new_start_time == time(10, 35)
    assert outcome.new_end_time == time(12, 35)
    assert outcome.new_start_datetime == datetime(2026, 8, 25, 10, 35, 0)
    assert outcome.new_end_datetime == datetime(2026, 8, 25, 12, 35, 0)

    # Check shifted block details
    shifted = outcome.shifted_block
    assert shifted is not None
    assert shifted.duration_minutes == 120
    assert shifted.start_time == time(10, 35)
    assert shifted.end_time == time(12, 35)
    assert shifted.total_criticality_index == sample_scheduled_block.total_criticality_index

    # Check internal shadow activities preserved with offsets
    assert len(shifted.activities) == 2
    act1, act2 = shifted.activities
    assert act1.duration_minutes == 120
    assert act1.start_offset_minutes == 0
    assert act1.end_offset_minutes == 120
    assert act2.duration_minutes == 60
    assert act2.start_offset_minutes == 15
    assert act2.end_offset_minutes == 75

    # Check serialization
    outcome_dict = outcome.to_dict()
    assert outcome_dict["action_taken"] == "TIME_SHIFT"
    assert outcome_dict["new_start_time"] == "10:35:00"
    assert outcome_dict["new_end_time"] == "12:35:00"


def test_reschedule_minor_delay_safety_buffer_absorbed(sample_scheduled_block: ScheduledBlock):
    """Delays <= 20 minutes are absorbed by statutory safety buffer without shifting possession window."""
    outcome = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=15,
        impacted_train_number="12675",
        impacted_train_name="Kovai Express",
        is_block_overrun=False,
        has_queued_trains=False,
    )

    assert outcome.success is True
    assert outcome.action_taken == RescheduleAction.BUFFER_ABSORBED.value
    assert outcome.delay_minutes == 15
    assert outcome.new_start_time == time(10, 0)
    assert outcome.new_end_time == time(12, 0)
    assert outcome.slw_advisory is None
    assert "absorbed" in outcome.reason.lower()


def test_reschedule_zero_or_negative_delay(sample_scheduled_block: ScheduledBlock):
    """Zero or negative delays require no schedule adjustments."""
    outcome_zero = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=0,
        impacted_train_number="12007",
    )
    assert outcome_zero.action_taken == RescheduleAction.NO_ACTION.value
    assert outcome_zero.new_start_time == time(10, 0)

    outcome_neg = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=-10,
        impacted_train_number="12007",
    )
    assert outcome_neg.action_taken == RescheduleAction.NO_ACTION.value


def test_reschedule_block_overrun_with_queued_trains_triggers_slw(
    sample_scheduled_block: ScheduledBlock,
):
    """AC: For block overruns (+15 min past granted window) with queued trains, trigger G&SR Chapter 5/15 SLW advisory."""
    outcome = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=25,  # +25m overrun
        impacted_train_number="20607",
        impacted_train_name="Vande Bharat Express",
        impacted_train_priority=TrainPriorityEnum.HIGH,
        is_block_overrun=True,
        has_queued_trains=True,
        parallel_line_available=True,
        line_type=LineTypeEnum.DOUBLE,
        section_code="MAS-AJJ",
        section_name="Chennai Central - Arakkonam",
        division="Chennai",
        zone="Southern Railway",
        queued_train_numbers=["20607", "12621", "12675"],
        freight_rakes_to_hold=["BOXN-7741", "BCN-9920"],
        private_number="PN-8421",
    )

    assert outcome.success is True
    assert outcome.action_taken == RescheduleAction.SLW_ADVISORY.value
    assert outcome.is_block_overrun is True
    assert outcome.has_queued_trains is True
    assert outcome.affected_trains_count == 3

    # Validate SLW Advisory Structure & G&SR Compliance
    slw = outcome.slw_advisory
    assert slw is not None
    assert isinstance(slw, SLWAdvisory)
    assert slw.gsr_rule_reference == GSR_SLW_RULE_REFERENCE
    assert slw.section_code == "MAS-AJJ"
    assert slw.section_name == "Chennai Central - Arakkonam"
    assert slw.obstructed_line == "UP Main Line"
    assert slw.single_line_in_use == "DOWN Main Line"
    assert slw.pilot_train_number == "20607"
    assert slw.pilot_train_name == "Vande Bharat Express"
    assert slw.private_number == "PN-8421"

    # AC: Verify statutory speed limits under G&SR
    assert slw.first_pilot_speed_kmph == SLW_FIRST_PILOT_MAX_SPEED_KMPH == 25
    assert slw.facing_points_speed_kmph == SLW_FACING_POINTS_MAX_SPEED_KMPH == 15
    assert slw.subsequent_train_speed_kmph == SLW_SUBSEQUENT_MAX_SPEED_KMPH == 40

    # AC: Verify freight siding holding orders
    assert len(slw.freight_siding_orders) == 2
    assert any("BOXN-7741" in o for o in slw.freight_siding_orders)
    assert any("BCN-9920" in o for o in slw.freight_siding_orders)

    # AC: Verify pre-formatted advisory text
    adv_text = slw.advisory_text
    assert "INDIAN RAILWAYS - OPERATIONAL SAFETY ADVISORY" in adv_text
    assert "GR 3.68" in adv_text
    assert "SINGLE LINE WORKING (SLW) EMERGENCY AUTHORIZATION NOTICE" in adv_text
    assert "MAS-AJJ (Chennai Central - Arakkonam)" in adv_text
    assert "PN-8421" in adv_text
    assert "25 km/h" in adv_text
    assert "15 km/h" in adv_text
    assert "40 km/h" in adv_text
    assert "BOXN-7741" in adv_text
    assert "Form T/351-B" in adv_text


def test_reschedule_block_overrun_without_queued_trains(
    sample_scheduled_block: ScheduledBlock,
):
    """Block overrun without queued trains emits an overrun warning rather than full emergency SLW."""
    outcome = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=20,
        impacted_train_number="12621",
        is_block_overrun=True,
        has_queued_trains=False,
    )

    assert outcome.success is True
    assert outcome.action_taken == RescheduleAction.OVERRUN_WARNING.value
    assert outcome.is_block_overrun is True
    assert outcome.has_queued_trains is False
    assert outcome.slw_advisory is None
    assert "warning" in outcome.reason.lower()


def test_reschedule_block_overrun_under_15_minutes_with_queued_trains(
    sample_scheduled_block: ScheduledBlock,
):
    """Block overrun under +15 mins with queued trains emits a warning rather than triggering emergency SLW."""
    outcome = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=10,  # +10m overrun (below 15m threshold)
        impacted_train_number="12621",
        is_block_overrun=True,
        has_queued_trains=True,
    )

    assert outcome.success is True
    assert outcome.action_taken == RescheduleAction.OVERRUN_WARNING.value
    assert outcome.is_block_overrun is True
    assert outcome.has_queued_trains is True
    assert outcome.slw_advisory is None
    assert "below statutory" in outcome.advisory_notes[0].lower()



def test_reschedule_block_overrun_on_single_line(sample_scheduled_block: ScheduledBlock):
    """On single-line track, SLW is impossible; rescheduler issues a SECTION_BLOCKADE holding order."""
    outcome = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=30,
        impacted_train_number="12621",
        is_block_overrun=True,
        has_queued_trains=True,
        parallel_line_available=False,
        line_type=LineTypeEnum.SINGLE,
    )

    assert outcome.success is True
    assert outcome.action_taken == RescheduleAction.SECTION_BLOCKADE.value
    assert outcome.slw_advisory is None
    assert "blockade" in outcome.reason.lower()


def test_polymorphic_input_scheduled_block_summary(
    sample_block_summary: ScheduledBlockSummary,
):
    """Test reschedule_on_disruption accepting ScheduledBlockSummary Pydantic model directly."""
    outcome = reschedule_on_disruption(
        active_block=sample_block_summary,
        delay_minutes=40,
        impacted_train_number="12621",
    )

    assert outcome.success is True
    assert outcome.action_taken == RescheduleAction.TIME_SHIFT.value
    assert outcome.original_start_time == time(14, 0)
    assert outcome.original_end_time == time(16, 30)
    assert outcome.new_start_time == time(14, 40)
    assert outcome.new_end_time == time(17, 10)
    assert outcome.shifted_block is not None
    assert len(outcome.shifted_block.activities) == 2


def test_polymorphic_input_dict(sample_scheduled_block: ScheduledBlock):
    """Test reschedule_on_disruption accepting raw dict representation."""
    block_dict = sample_scheduled_block.to_dict()
    outcome = reschedule_on_disruption(
        active_block=block_dict,
        delay_minutes=25,
        impacted_train_number="12621",
    )

    assert outcome.success is True
    assert outcome.action_taken == RescheduleAction.TIME_SHIFT.value
    assert outcome.new_start_time == time(10, 25)
    assert outcome.new_end_time == time(12, 25)


def test_midnight_date_rollover():
    """Test greedy shift crossing 00:00 midnight correctly increments the block date."""
    target_d = date(2026, 8, 25)
    start_dt = datetime(2026, 8, 25, 23, 30, 0)
    end_dt = datetime(2026, 8, 26, 1, 30, 0)

    late_block = ScheduledBlock(
        id=uuid4(),
        candidate_block_id=uuid4(),
        corridor_gap_id=uuid4(),
        section_id=uuid4(),
        section_code="MAS-AJJ",
        block_date=target_d,
        start_time=time(23, 30),
        end_time=time(1, 30),
        start_datetime=start_dt,
        end_datetime=end_dt,
        duration_minutes=120,
        is_joint_shadow_block=False,
        primary_department=DepartmentEnum.TRACK,
        participating_departments=[DepartmentEnum.TRACK],
        total_criticality_index=80.0,
        shadow_overlap_hours=0.0,
        estimated_train_detention_minutes=0,
        activities=[],
        requests_covered_ids=[],
        status=BlockStatusEnum.PROPOSED,
    )

    outcome = reschedule_on_disruption(
        active_block=late_block,
        delay_minutes=45,  # 23:30 + 45m = 00:15 on next day (2026-08-26)
        impacted_train_number="12621",
    )

    assert outcome.action_taken == RescheduleAction.TIME_SHIFT.value
    assert outcome.new_start_time == time(0, 15)
    assert outcome.new_end_time == time(2, 15)
    assert outcome.new_start_datetime == datetime(2026, 8, 26, 0, 15, 0)
    assert outcome.new_end_datetime == datetime(2026, 8, 26, 2, 15, 0)
    assert outcome.shifted_block is not None
    assert outcome.shifted_block.block_date == date(2026, 8, 26)


def test_frozen_dataclass_immutability(sample_scheduled_block: ScheduledBlock):
    """Verify RescheduleOutcome and SLWAdvisory are strictly immutable frozen dataclasses."""
    outcome = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=30,
        impacted_train_number="12621",
    )

    with pytest.raises(FrozenInstanceError):
        outcome.delay_minutes = 99  # type: ignore

    slw_outcome = reschedule_on_disruption(
        active_block=sample_scheduled_block,
        delay_minutes=30,
        impacted_train_number="12621",
        is_block_overrun=True,
        has_queued_trains=True,
    )

    with pytest.raises(FrozenInstanceError):
        slw_outcome.slw_advisory.first_pilot_speed_kmph = 50  # type: ignore


def test_pydantic_schema_validation(sample_block_summary: ScheduledBlockSummary):
    """Verify Pydantic RescheduleRequest and RescheduleResponse schemas validate correctly."""
    req = RescheduleRequest(
        active_block=sample_block_summary,
        delay_minutes=30,
        impacted_train_number="12621",
        impacted_train_name="Tamil Nadu Express",
        is_block_overrun=True,
        has_queued_trains=True,
        queued_train_numbers=["12621", "20607"],
        private_number="PN-9012",
    )
    assert req.delay_minutes == 30

    outcome = reschedule_on_disruption(
        active_block=sample_block_summary,
        delay_minutes=req.delay_minutes,
        impacted_train_number=req.impacted_train_number,
        is_block_overrun=req.is_block_overrun,
        has_queued_trains=req.has_queued_trains,
        queued_train_numbers=req.queued_train_numbers,
        private_number=req.private_number,
    )

    resp_dict = outcome.to_dict()
    # Validate against Pydantic schema
    resp = RescheduleResponse.model_validate(resp_dict)
    assert resp.action_taken == RescheduleActionEnum.SLW_ADVISORY
    assert resp.success is True
    assert resp.slw_advisory is not None
    assert resp.slw_advisory.first_pilot_speed_kmph == 25


def test_performance_sub_millisecond_benchmark(sample_scheduled_block: ScheduledBlock):
    """Verify performance SLA: 1000 reschedules executed in < 0.5 seconds (< 0.5ms each)."""
    n_iterations = 1000
    t_start = _time.perf_counter()

    for i in range(n_iterations):
        reschedule_on_disruption(
            active_block=sample_scheduled_block,
            delay_minutes=25 + (i % 30),
            impacted_train_number="12621",
        )

    t_total = _time.perf_counter() - t_start
    avg_ms = (t_total / n_iterations) * 1000.0

    assert t_total < 0.5  # 1000 runs in under 500ms
    assert avg_ms < 0.5   # Under 0.5ms per reschedule


def test_td602_authority_sheet_and_phone_script_generation():
    """Verify structured Form T/D 602 Authority sheet and Section Controller phone script."""
    ts = datetime(2026, 8, 25, 12, 30, 0)
    sheet = generate_td602_authority_sheet(
        section_code="MAS-AJJ",
        section_name="Chennai Central - Arakkonam",
        obstructed_line="UP Main Line",
        single_line_in_use="DOWN Main Line",
        pilot_train_number="12621",
        private_number="PN-9988",
        timestamp=ts,
        division="Chennai",
        zone="Southern Railway",
    )

    assert sheet["form_name"] == "Form T/D 602"
    assert sheet["statutory_rule"] == "GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15"
    assert sheet["section_code"] == "MAS-AJJ"
    assert sheet["pilot_train_number"] == "12621"
    assert sheet["station_master_private_number"] == "PN-9988"
    assert sheet["part_3_caution_order"]["pilot_train_speed"] == "25 km/h (Day/Night pilot speed ceiling)"
    assert sheet["part_3_caution_order"]["facing_points_speed"] == "15 km/h over all facing points and crossovers"

    script = generate_controller_phone_script(
        section_code="MAS-AJJ",
        obstructed_line="UP Main Line",
        single_line_in_use="DOWN Main Line",
        pilot_train_number="12621",
        private_number="PN-9988",
    )
    assert "[CONTROL PHONE SCRIPT - SECTION CONTROLLER TO ALL STATIONS MAS-AJJ]" in script
    assert "First Pilot Train is 12621" in script
    assert "PN-9988" in script

