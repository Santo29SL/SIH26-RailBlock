"""Unit tests for Corridor Gap and Headway Extractor Service (Stage 3).

Verifies:
1. Empty schedule handling (full 24-hour corridor gap).
2. Mandatory statutory Safety Buffer (>=15 min) enforcement before entry and after exit.
3. Short gap filtering (<60 min by default).
4. Continuous rolling midnight boundaries and multi-day transitions.
5. Overlapping and contiguous buffer interval merging.
6. Directional line filtering (UP Line vs DOWN Line vs BOTH).
7. High-priority VIP passenger train proximity detection (Rajdhani, Vande Bharat, Shatabdi).
8. Frozen dataclass properties and helper methods.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Optional

import pytest

from app.schemas.common import LineTypeEnum, TrainPriorityEnum, TrainTypeEnum
from app.services.gap_extractor import (
    CorridorGap,
    extract_corridor_gaps,
    get_movement_direction,
    is_vip_train,
)


# ── Test Fixture Helpers ────────────────────────────────────


@dataclass
class MockTrain:
    """Mock Train model instance for testing."""

    id: uuid.UUID
    train_number: str
    train_name: str
    train_type: TrainTypeEnum = TrainTypeEnum.EXPRESS
    priority: TrainPriorityEnum = TrainPriorityEnum.MEDIUM
    line_direction: Optional[str] = None


@dataclass
class MockTrainMovement:
    """Mock TrainMovement model instance for testing."""

    id: uuid.UUID
    train_id: uuid.UUID
    section_id: uuid.UUID
    departure_time: time
    arrival_time: time
    day_of_week: int  # 0=Monday, 6=Sunday
    movement_type: str = "SCHEDULED"
    is_active: bool = True
    train: Optional[MockTrain] = None
    line_direction: Optional[str] = None


def make_movement(
    section_id: uuid.UUID,
    dep: time,
    arr: time,
    day_of_week: int = 1,  # Tuesday by default (2026-08-25)
    train_number: str = "12621",
    train_name: str = "Grand Trunk Express",
    train_type: TrainTypeEnum = TrainTypeEnum.EXPRESS,
    priority: TrainPriorityEnum = TrainPriorityEnum.MEDIUM,
    movement_type: str = "SCHEDULED",
    is_active: bool = True,
    line_direction: Optional[str] = None,
) -> MockTrainMovement:
    """Helper to construct a mock train movement with attached train."""
    t_id = uuid.uuid4()
    train = MockTrain(
        id=t_id,
        train_number=train_number,
        train_name=train_name,
        train_type=train_type,
        priority=priority,
        line_direction=line_direction,
    )
    return MockTrainMovement(
        id=uuid.uuid4(),
        train_id=t_id,
        section_id=section_id,
        departure_time=dep,
        arrival_time=arr,
        day_of_week=day_of_week,
        movement_type=movement_type,
        is_active=is_active,
        train=train,
        line_direction=line_direction,
    )


# ── 1. Basic Corridor Gap Extraction Tests ──────────────────


def test_empty_schedule_returns_full_day_gap():
    """When no trains operate on a section, a single 24-hour (1440 min) gap is returned."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)  # Tuesday (weekday 1)

    gaps = extract_corridor_gaps(
        movements=[],
        target_date=target_date,
        section_id=sec_id,
    )

    assert len(gaps) == 1
    gap = gaps[0]
    assert isinstance(gap, CorridorGap)
    assert gap.section_id == sec_id
    assert gap.target_date == target_date
    assert gap.start_time == time(0, 0)
    assert gap.end_time == time(0, 0)
    assert gap.duration_minutes == 1440
    assert gap.has_vip_train_proximity is False
    assert gap.preceding_train_id is None
    assert gap.following_train_id is None


def test_single_train_creates_two_buffered_gaps():
    """A single train running 12:00 to 12:30 creates 2 gaps: 00:00-11:45 and 12:45-00:00."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)  # Tuesday (weekday 1)

    m = make_movement(
        section_id=sec_id,
        dep=time(12, 0),
        arr=time(12, 30),
        day_of_week=1,
        train_number="12622",
        train_name="Tamil Nadu Express",
    )

    gaps = extract_corridor_gaps(
        movements=[m],
        target_date=target_date,
        section_id=sec_id,
        safety_buffer_minutes=15,
        min_gap_minutes=60,
    )

    assert len(gaps) == 2

    # Morning gap: 00:00 to (12:00 - 15m) = 11:45 (705 mins)
    gap1 = gaps[0]
    assert gap1.start_time == time(0, 0)
    assert gap1.end_time == time(11, 45)
    assert gap1.duration_minutes == 705
    assert gap1.following_train_number == "12622"
    assert gap1.preceding_train_number is None

    # Afternoon/evening gap: (12:30 + 15m) = 12:45 to 00:00 (675 mins)
    gap2 = gaps[1]
    assert gap2.start_time == time(12, 45)
    assert gap2.end_time == time(0, 0)
    assert gap2.duration_minutes == 675
    assert gap2.preceding_train_number == "12622"
    assert gap2.following_train_number is None


# ── 2. Safety Buffer & Short Gap Filtering Tests ────────────


def test_short_gap_filtering():
    """Gaps shorter than min_gap_minutes (default 60 mins) are filtered out."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)

    # Train 1: 06:00 to 06:30 -> Blocked 05:45 to 06:45
    # Train 2: 07:30 to 08:00 -> Blocked 07:15 to 08:15
    # Gap between them: 06:45 to 07:15 = 30 mins (< 60 mins)
    m1 = make_movement(sec_id, dep=time(6, 0), arr=time(6, 30), day_of_week=1, train_number="101")
    m2 = make_movement(sec_id, dep=time(7, 30), arr=time(8, 0), day_of_week=1, train_number="102")

    # With default min_gap_minutes=60, the 30-min gap should NOT appear
    gaps_60 = extract_corridor_gaps(
        movements=[m1, m2],
        target_date=target_date,
        section_id=sec_id,
        min_gap_minutes=60,
    )
    # Gaps should only be: 00:00 to 05:45 (345 min) and 08:15 to 00:00 (945 min)
    assert len(gaps_60) == 2
    assert gaps_60[0].duration_minutes == 345
    assert gaps_60[1].duration_minutes == 945

    # If min_gap_minutes=15, the 30-min gap is included
    gaps_15 = extract_corridor_gaps(
        movements=[m1, m2],
        target_date=target_date,
        section_id=sec_id,
        min_gap_minutes=15,
    )
    assert len(gaps_15) == 3
    assert gaps_15[1].start_time == time(6, 45)
    assert gaps_15[1].end_time == time(7, 15)
    assert gaps_15[1].duration_minutes == 30


def test_overlapping_safety_buffers_merge():
    """Trains arriving in close proximity have their safety buffers merged without spurious gaps."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)

    # Train 1: 10:00 to 10:30 -> Blocked 09:45 to 10:45
    # Train 2: 10:40 to 11:00 -> Blocked 10:25 to 11:15
    # Since 10:25 < 10:45, blocked interval becomes 09:45 to 11:15
    m1 = make_movement(sec_id, dep=time(10, 0), arr=time(10, 30), day_of_week=1)
    m2 = make_movement(sec_id, dep=time(10, 40), arr=time(11, 0), day_of_week=1)

    gaps = extract_corridor_gaps(
        movements=[m1, m2],
        target_date=target_date,
        section_id=sec_id,
        safety_buffer_minutes=15,
        min_gap_minutes=15,
    )

    # There should only be two gaps: morning before 09:45, afternoon after 11:15
    assert len(gaps) == 2
    assert gaps[0].end_time == time(9, 45)
    assert gaps[1].start_time == time(11, 15)


# ── 3. Rolling Midnight Boundary Tests ──────────────────────


def test_previous_day_midnight_spillover():
    """A train on Monday night arriving at 23:50 blocks Tuesday morning until 00:05."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)  # Tuesday (weekday 1)

    # Monday night train (day_of_week=0) arrives at 23:50
    # Buffer +15 min extends to Tuesday 00:05
    monday_train = make_movement(
        sec_id,
        dep=time(23, 20),
        arr=time(23, 50),
        day_of_week=0,  # Monday
        train_number="12601",
        train_name="Mangalore Mail",
    )

    # Tuesday morning train at 04:00 (blocked from 03:45)
    tuesday_train = make_movement(
        sec_id,
        dep=time(4, 0),
        arr=time(4, 30),
        day_of_week=1,  # Tuesday
        train_number="12602",
        train_name="Chennai Mail",
    )

    gaps = extract_corridor_gaps(
        movements=[monday_train, tuesday_train],
        target_date=target_date,
        section_id=sec_id,
        safety_buffer_minutes=15,
        min_gap_minutes=60,
    )

    # Gap 1 on Tuesday must start at 00:05 (NOT 00:00) and end at 03:45 -> 220 mins
    assert len(gaps) >= 1
    gap = gaps[0]
    assert gap.start_time == time(0, 5)
    assert gap.end_time == time(3, 45)
    assert gap.duration_minutes == 220
    assert gap.preceding_train_number == "12601"
    assert gap.following_train_number == "12602"


def test_overnight_train_crossing_midnight():
    """A train departing 23:45 and arriving 00:20 crosses midnight and blocks until 00:35."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)  # Tuesday

    # Monday night overnight train: dep 23:45 Monday, arr 00:20 Tuesday
    # Blocked Monday 23:30 to Tuesday 00:35
    overnight_train = make_movement(
        sec_id,
        dep=time(23, 45),
        arr=time(0, 20),
        day_of_week=0,  # Monday
        train_number="16101",
        train_name="Boat Mail",
    )

    # Tuesday train at 05:00
    tuesday_train = make_movement(
        sec_id,
        dep=time(5, 0),
        arr=time(5, 30),
        day_of_week=1,  # Tuesday
        train_number="16102",
    )

    gaps = extract_corridor_gaps(
        movements=[overnight_train, tuesday_train],
        target_date=target_date,
        section_id=sec_id,
        safety_buffer_minutes=15,
        min_gap_minutes=60,
    )

    assert len(gaps) >= 1
    gap = gaps[0]
    assert gap.start_time == time(0, 35)
    assert gap.end_time == time(4, 45)
    assert gap.duration_minutes == 250
    assert gap.preceding_train_number == "16101"


# ── 4. VIP Train Proximity Detection Tests ──────────────────


def test_vande_bharat_proximity_flagged():
    """Corridor gaps adjacent to Vande Bharat or Rajdhani have has_vip_train_proximity=True."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)

    vb_train = make_movement(
        sec_id,
        dep=time(6, 0),
        arr=time(6, 40),
        day_of_week=1,
        train_number="20607",
        train_name="Chennai - Mysuru Vande Bharat Express",
        train_type=TrainTypeEnum.SUPERFAST,
        priority=TrainPriorityEnum.HIGH,
    )

    regular_train = make_movement(
        sec_id,
        dep=time(10, 0),
        arr=time(10, 30),
        day_of_week=1,
        train_number="12675",
        train_name="Kovai Express",
        train_type=TrainTypeEnum.EXPRESS,
        priority=TrainPriorityEnum.MEDIUM,
    )

    gaps = extract_corridor_gaps(
        movements=[vb_train, regular_train],
        target_date=target_date,
        section_id=sec_id,
        safety_buffer_minutes=15,
        min_gap_minutes=60,
    )

    # Gap 1 (00:00 to 05:45) is followed by Vande Bharat -> VIP proximity True
    assert gaps[0].following_train_name == "Chennai - Mysuru Vande Bharat Express"
    assert gaps[0].has_vip_train_proximity is True

    # Gap 2 (06:55 to 09:45) is preceded by Vande Bharat -> VIP proximity True
    assert gaps[1].preceding_train_name == "Chennai - Mysuru Vande Bharat Express"
    assert gaps[1].has_vip_train_proximity is True

    # Gap 3 (10:45 to 00:00) is preceded by regular train -> VIP proximity False
    assert gaps[2].has_vip_train_proximity is False


def test_is_vip_train_keywords_and_priority():
    """Verify is_vip_train correctly identifies various Tier 1 train configurations."""
    assert is_vip_train(MockTrain(uuid.uuid4(), "12433", "Rajdhani Express")) is True
    assert is_vip_train(MockTrain(uuid.uuid4(), "20608", "Vande Bharat Express")) is True
    assert is_vip_train(MockTrain(uuid.uuid4(), "12007", "Shatabdi Express")) is True
    assert is_vip_train(MockTrain(uuid.uuid4(), "22119", "Tejas Express")) is True
    assert is_vip_train(MockTrain(uuid.uuid4(), "12269", "Duronto Express")) is True
    assert is_vip_train(MockTrain(uuid.uuid4(), "12049", "Gatimaan Express")) is True

    # High priority regular train name
    assert is_vip_train(MockTrain(uuid.uuid4(), "12621", "Tamil Nadu Express", priority=TrainPriorityEnum.HIGH)) is True

    # Regular train with medium priority
    assert is_vip_train(MockTrain(uuid.uuid4(), "12621", "Tamil Nadu Express", priority=TrainPriorityEnum.MEDIUM)) is False
    assert is_vip_train(None) is False


# ── 5. Directional Line Segregation Tests ───────────────────


def test_directional_line_filtering():
    """Extract corridor gaps specifically for UP line vs DOWN line."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)

    # UP Line train (even number 12622)
    up_train = make_movement(
        sec_id,
        dep=time(10, 0),
        arr=time(10, 30),
        day_of_week=1,
        train_number="12622",
        line_direction="UP",
    )

    # DOWN Line train (odd number 12621)
    down_train = make_movement(
        sec_id,
        dep=time(14, 0),
        arr=time(14, 30),
        day_of_week=1,
        train_number="12621",
        line_direction="DOWN",
    )

    # Extract UP line only: down_train should NOT block the UP line
    up_gaps = extract_corridor_gaps(
        movements=[up_train, down_train],
        target_date=target_date,
        section_id=sec_id,
        line_direction="UP",
    )
    # UP line has gap 00:00-09:45 (585m) and 10:45-00:00 (795m)
    assert len(up_gaps) == 2
    assert all(g.line_direction == "UP" for g in up_gaps)
    assert up_gaps[1].duration_minutes == 795

    # Extract DOWN line only: up_train should NOT block the DOWN line
    down_gaps = extract_corridor_gaps(
        movements=[up_train, down_train],
        target_date=target_date,
        section_id=sec_id,
        line_direction="DOWN",
    )
    assert len(down_gaps) == 2
    assert all(g.line_direction == "DOWN" for g in down_gaps)
    assert down_gaps[0].duration_minutes == 825  # 00:00 to 13:45


def test_single_line_section_blocks_both_directions():
    """On a SINGLE line section, all trains block the single track regardless of direction."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)

    up_train = make_movement(sec_id, dep=time(10, 0), arr=time(10, 30), day_of_week=1, line_direction="UP")
    down_train = make_movement(sec_id, dep=time(14, 0), arr=time(14, 30), day_of_week=1, line_direction="DOWN")

    gaps = extract_corridor_gaps(
        movements=[up_train, down_train],
        target_date=target_date,
        section_id=sec_id,
        section_line_type=LineTypeEnum.SINGLE,
    )

    # On single line, both trains occupy the line: 3 gaps (before 09:45, between 10:45-13:45, after 14:45)
    assert len(gaps) == 3
    assert gaps[0].end_time == time(9, 45)
    assert gaps[1].start_time == time(10, 45)
    assert gaps[1].end_time == time(13, 45)
    assert gaps[2].start_time == time(14, 45)


# ── 6. Inactive Movements and Multi-Section Filtering ───────


def test_inactive_movements_and_other_sections_ignored():
    """Inactive train movements and movements for other sections are safely ignored."""
    sec_id = uuid.uuid4()
    other_sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)

    active_m = make_movement(sec_id, dep=time(12, 0), arr=time(12, 30), is_active=True)
    inactive_m = make_movement(sec_id, dep=time(15, 0), arr=time(15, 30), is_active=False)
    other_m = make_movement(other_sec_id, dep=time(18, 0), arr=time(18, 30), is_active=True)

    gaps = extract_corridor_gaps(
        movements=[active_m, inactive_m, other_m],
        target_date=target_date,
        section_id=sec_id,
    )

    # Only active_m on sec_id affects the schedule -> 2 gaps
    assert len(gaps) == 2


# ── 7. CorridorGap Helper Methods Tests ─────────────────────


def test_corridor_gap_helpers():
    """Test to_dict(), is_night_window, and contains_window helper methods."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)

    gap = CorridorGap(
        id=uuid.uuid4(),
        section_id=sec_id,
        target_date=target_date,
        start_time=time(1, 30),
        end_time=time(4, 30),
        start_datetime=datetime(2026, 8, 25, 1, 30),
        end_datetime=datetime(2026, 8, 25, 4, 30),
        duration_minutes=180,
        line_direction="UP",
        safety_buffer_minutes=15,
        has_vip_train_proximity=False,
    )

    # Dictionary conversion
    d = gap.to_dict()
    assert d["duration_minutes"] == 180
    assert d["line_direction"] == "UP"
    assert d["has_vip_train_proximity"] is False

    # Night window check (01:30 - 04:30 is night hours)
    assert gap.is_night_window is True

    # Daytime gap
    day_gap = CorridorGap(
        id=uuid.uuid4(),
        section_id=sec_id,
        target_date=target_date,
        start_time=time(13, 0),
        end_time=time(16, 0),
        start_datetime=datetime(2026, 8, 25, 13, 0),
        end_datetime=datetime(2026, 8, 25, 16, 0),
        duration_minutes=180,
        line_direction="DOWN",
        safety_buffer_minutes=15,
    )
    assert day_gap.is_night_window is False

    # contains_window
    assert gap.contains_window(time(2, 0), time(3, 30)) is True
    assert gap.contains_window(time(1, 0), time(3, 0)) is False  # Starts too early
    assert gap.contains_window(time(3, 0), time(5, 0)) is False  # Ends too late


def test_forecast_freight_reduces_corridor_gaps():
    """Verify that FORECAST_FREIGHT movements are recognized as corridor occupancy and reduce the available gap window."""
    sec_id = uuid.uuid4()
    target_date = date(2026, 8, 25)  # Tuesday (weekday 1)

    # 1. Baseline with only 1 scheduled train in morning: 08:00 - 08:30
    # Available afternoon gap: 08:45 to 24:00 (915 min)
    scheduled_mov = make_movement(
        section_id=sec_id,
        dep=time(8, 0),
        arr=time(8, 30),
        day_of_week=1,
        train_number="12621",
        movement_type="SCHEDULED",
    )
    baseline_gaps = extract_corridor_gaps(
        movements=[scheduled_mov],
        target_date=target_date,
        section_id=sec_id,
    )
    total_baseline_duration = sum(g.duration_minutes for g in baseline_gaps)

    # 2. Add a FORECAST_FREIGHT movement occupying afternoon path: 14:00 - 15:30
    forecast_freight_mov = make_movement(
        section_id=sec_id,
        dep=time(14, 0),
        arr=time(15, 30),
        day_of_week=1,
        train_number="FRT-001",
        train_name="Anticipated Goods Rake (BOXN)",
        train_type=TrainTypeEnum.FREIGHT,
        priority=TrainPriorityEnum.LOW,
        movement_type="FORECAST_FREIGHT",
    )
    forecast_gaps = extract_corridor_gaps(
        movements=[scheduled_mov, forecast_freight_mov],
        target_date=target_date,
        section_id=sec_id,
    )
    total_forecast_duration = sum(g.duration_minutes for g in forecast_gaps)

    # The forecast freight movement must occupy corridor capacity, reducing total gap minutes
    assert total_forecast_duration < total_baseline_duration
    # Specifically, gap splits around 14:00 - 15:30 + buffers (13:45 to 15:45 = 120 min occupied)
    assert len(forecast_gaps) > len(baseline_gaps)

