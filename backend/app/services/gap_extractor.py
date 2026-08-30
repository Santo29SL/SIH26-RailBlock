"""Corridor gap and headway extractor service.

Analyzes timetabled train movements on a railway section and extracts all available
continuous unoccupied corridor gaps (>= 60 mins by default) with statutory safety
buffers (>= 15 mins by default) enforced before and after each train passage,
handling rolling midnight boundaries and directional track lines.

Domain terminology follows CONTEXT.md:
- Section: Track segment between two consecutive block stations.
- Corridor Gap: A continuous time interval on a section during which no train movements occupy the track.
- Safety Buffer: Statutory minimum time headway enforced before train entry and after train clearance.
- Directional Line: UP Line vs DOWN Line vs BOTH / SINGLE line.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from typing import Any, Dict, List, Optional, Sequence, Tuple
from uuid import UUID, uuid4

from app.core.config import settings
from app.schemas.common import LineTypeEnum, TrainPriorityEnum, TrainTypeEnum


# ── VIP Train Identification Keywords ──────────────────────

VIP_TRAIN_KEYWORDS: Tuple[str, ...] = (
    "RAJDHANI",
    "VANDE BHARAT",
    "SHATABDI",
    "TEJAS",
    "DURONTO",
    "GATIMAAN",
)


# ── Domain Data Structures ─────────────────────────────────


@dataclass(frozen=True)
class CorridorGap:
    """An unoccupied continuous time window on a railway section suitable for maintenance possession.

    Canonical domain term: Corridor Gap (see CONTEXT.md).
    Statutory minimum Safety Buffer is enforced before train entry and after train clearance.
    """

    id: UUID
    section_id: UUID
    target_date: date
    start_time: time
    end_time: time
    start_datetime: datetime
    end_datetime: datetime
    duration_minutes: int
    line_direction: str  # "UP", "DOWN", "BOTH", or "SINGLE"
    safety_buffer_minutes: int
    has_vip_train_proximity: bool = False
    preceding_train_id: Optional[UUID] = None
    preceding_train_number: Optional[str] = None
    preceding_train_name: Optional[str] = None
    preceding_train_type: Optional[str] = None
    preceding_train_priority: Optional[str] = None
    following_train_id: Optional[UUID] = None
    following_train_number: Optional[str] = None
    following_train_name: Optional[str] = None
    following_train_type: Optional[str] = None
    following_train_priority: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert CorridorGap instance to a standard dictionary representation."""
        return {
            "id": str(self.id),
            "section_id": str(self.section_id),
            "target_date": self.target_date.isoformat(),
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "start_datetime": self.start_datetime.isoformat(),
            "end_datetime": self.end_datetime.isoformat(),
            "duration_minutes": self.duration_minutes,
            "line_direction": self.line_direction,
            "safety_buffer_minutes": self.safety_buffer_minutes,
            "has_vip_train_proximity": self.has_vip_train_proximity,
            "preceding_train_id": str(self.preceding_train_id) if self.preceding_train_id else None,
            "preceding_train_number": self.preceding_train_number,
            "preceding_train_name": self.preceding_train_name,
            "preceding_train_type": self.preceding_train_type,
            "preceding_train_priority": self.preceding_train_priority,
            "following_train_id": str(self.following_train_id) if self.following_train_id else None,
            "following_train_number": self.following_train_number,
            "following_train_name": self.following_train_name,
            "following_train_type": self.following_train_type,
            "following_train_priority": self.following_train_priority,
        }

    @property
    def is_night_window(self) -> bool:
        """True if the gap falls predominantly during standard night maintenance hours (22:00 - 06:00)."""
        # Checks if start or end is within night hours, or spans through night
        night_hours = {22, 23, 0, 1, 2, 3, 4, 5}
        return self.start_time.hour in night_hours or self.end_time.hour in night_hours

    def contains_window(self, req_start: time, req_end: time, req_date: Optional[date] = None) -> bool:
        """Check whether a requested time interval fits entirely within this corridor gap."""
        effective_date = req_date or self.target_date
        req_start_dt = datetime.combine(effective_date, req_start)
        if req_end >= req_start:
            req_end_dt = datetime.combine(effective_date, req_end)
        else:
            req_end_dt = datetime.combine(effective_date + timedelta(days=1), req_end)
        return self.start_datetime <= req_start_dt and req_end_dt <= self.end_datetime


@dataclass
class _MovementOccurrence:
    """Internal helper representing a concrete scheduled train passage on a specific calendar date."""

    movement: Any
    train: Any
    entry_dt: datetime
    exit_dt: datetime
    blocked_start: datetime
    blocked_end: datetime
    direction: str
    is_vip: bool


@dataclass
class _MergedBlockedInterval:
    """Internal helper representing a contiguous blocked space-time window on a track line."""

    start: datetime
    end: datetime
    occurrences: List[_MovementOccurrence] = field(default_factory=list)


# ── Helper Evaluation Functions ────────────────────────────


def is_vip_train(train: Any) -> bool:
    """Check if a train qualifies as a Tier 1 VIP service under ADR 0003.

    Identifies Rajdhani, Vande Bharat, Shatabdi, Tejas, Duronto, Gatimaan,
    or any train with priority set to HIGH / CRITICAL.
    """
    if train is None:
        return False

    name = str(getattr(train, "train_name", "") or "").upper()
    if any(keyword in name for keyword in VIP_TRAIN_KEYWORDS):
        return True

    priority = getattr(train, "priority", None)
    if priority is not None:
        priority_str = priority.value if hasattr(priority, "value") else str(priority)
        if priority_str.upper() in (TrainPriorityEnum.HIGH.value, "CRITICAL", "1", "VIP"):
            return True

    return False


def get_movement_direction(movement: Any, default: str = "UP") -> str:
    """Determine the directional line (UP vs DOWN vs BOTH) for a train movement.

    Checks explicit direction attributes on the movement or train, then falls back
    to the Indian Railways train numbering convention (even number = UP, odd number = DOWN).
    """
    # 1. Direct attribute on movement
    for attr in ("line_direction", "direction"):
        val = getattr(movement, attr, None)
        if val is not None:
            val_str = str(val.value if hasattr(val, "value") else val).upper()
            if val_str in ("UP", "DOWN", "BOTH", "SINGLE"):
                return val_str

    # 2. Attribute on related train
    train = getattr(movement, "train", None)
    if train is not None:
        for attr in ("line_direction", "direction"):
            val = getattr(train, attr, None)
            if val is not None:
                val_str = str(val.value if hasattr(val, "value") else val).upper()
                if val_str in ("UP", "DOWN", "BOTH", "SINGLE"):
                    return val_str

        # 3. Train number parity heuristic (IR standard: even=UP, odd=DOWN)
        train_num_str = str(getattr(train, "train_number", "") or "")
        digits = "".join(filter(str.isdigit, train_num_str))
        if digits:
            try:
                num = int(digits)
                return "UP" if num % 2 == 0 else "DOWN"
            except ValueError:
                pass

    return default


def _extract_train_info(train: Any) -> Tuple[Optional[UUID], Optional[str], Optional[str], Optional[str], Optional[str]]:
    """Helper to safely extract train identifier and metadata attributes."""
    if train is None:
        return None, None, None, None, None

    train_id = getattr(train, "id", None)
    train_num = getattr(train, "train_number", None)
    train_name = getattr(train, "train_name", None)

    train_type = getattr(train, "train_type", None)
    if train_type is not None:
        train_type = train_type.value if hasattr(train_type, "value") else str(train_type)

    priority = getattr(train, "priority", None)
    if priority is not None:
        priority = priority.value if hasattr(priority, "value") else str(priority)

    return train_id, train_num, train_name, train_type, priority


# ── Core Gap Extractor Engine ──────────────────────────────


def extract_corridor_gaps(
    movements: Sequence[Any],
    target_date: date,
    section_id: UUID,
    min_gap_minutes: int = settings.DEFAULT_MIN_GAP_MINUTES,
    safety_buffer_minutes: int = settings.DEFAULT_SAFETY_BUFFER_MINUTES,
    line_direction: Optional[str] = None,
    section_line_type: Optional[str | LineTypeEnum] = None,
    horizon_days: int = 1,
) -> List[CorridorGap]:
    """Extract continuous unoccupied corridor gaps on a railway section.

    Enforces mandatory statutory safety buffers (>=15 mins) before entry and after
    clearance of every train, filters out gaps shorter than min_gap_minutes (>=60 mins),
    handles continuous rolling midnight boundaries across days, segregates directional
    tracks (UP vs DOWN line), and flags proximity to high-priority VIP passenger trains.

    Freight Forecast Overlay:
    Anticipated goods-train paths from the COA goods trains forecast (flagged FORECAST_FREIGHT)
    are included as corridor occupancy identical to scheduled movements (MVP simplification),
    ensuring that extracted gaps reflect both scheduled timetable and forecast freight demand.

    Args:
        movements: TrainMovement records (SCHEDULED and FORECAST_FREIGHT, with departure_time, arrival_time, day_of_week, train).
        target_date: Target planning date for corridor gap extraction.
        section_id: Target Section UUID.
        min_gap_minutes: Minimum duration in minutes for an unoccupied window to qualify as a Corridor Gap.
        safety_buffer_minutes: Statutory headway buffer in minutes enforced before and after train passage.
        line_direction: Optional filter for track line ("UP", "DOWN", "BOTH", "SINGLE"). If None, processes all.
        section_line_type: Optional LineType ("SINGLE", "DOUBLE", "QUADRUPLE").
        horizon_days: Planning horizon in days (default 1).

    Returns:
        List of frozen CorridorGap dataclasses sorted chronologically.
    """
    buffer_delta = timedelta(minutes=safety_buffer_minutes)
    horizon_start = datetime.combine(target_date, time(0, 0))
    horizon_end = datetime.combine(target_date + timedelta(days=horizon_days), time(0, 0))

    # Normalize line_direction filter
    req_direction = line_direction.upper() if line_direction else None

    # Determine if the section operates as a single bidirectional line
    is_single_line = False
    if section_line_type:
        s_type = section_line_type.value if hasattr(section_line_type, "value") else str(section_line_type)
        is_single_line = s_type.upper() in (LineTypeEnum.SINGLE.value, "SINGLE")

    # Filter active movements belonging to this section
    relevant_movements = []
    for m in movements:
        # Check section_id if present
        m_sec_id = getattr(m, "section_id", None)
        if m_sec_id is not None and m_sec_id != section_id:
            continue
        # Check is_active if present
        if not getattr(m, "is_active", True):
            continue
        relevant_movements.append(m)

    # ── 1. Build Multi-Day Train Occurrences (Handling Rolling Midnight) ────
    # We examine [target_date - 1 day] to [target_date + horizon_days] to accurately
    # capture spill-over safety buffers and overnight train passages across midnight.
    occurrences: List[_MovementOccurrence] = []
    eval_days = [
        target_date + timedelta(days=offset)
        for offset in range(-1, horizon_days + 1)
    ]

    for eval_day in eval_days:
        day_dow = eval_day.weekday()  # 0=Monday, 6=Sunday

        for m in relevant_movements:
            m_dow = getattr(m, "day_of_week", None)
            if m_dow is not None and m_dow != day_dow:
                continue

            train = getattr(m, "train", None)
            direction = get_movement_direction(m)
            is_vip = is_vip_train(train)

            # Apply directional filter if specified (single lines always affect both directions)
            if req_direction and not is_single_line:
                if req_direction in ("UP", "DOWN") and direction != req_direction and direction not in ("BOTH", "SINGLE"):
                    continue

            dep_time: time = getattr(m, "departure_time", time(0, 0))
            arr_time: time = getattr(m, "arrival_time", time(0, 0))

            entry_dt = datetime.combine(eval_day, dep_time)
            if arr_time >= dep_time:
                exit_dt = datetime.combine(eval_day, arr_time)
            else:
                # Train enters before midnight and clears section after midnight
                exit_dt = datetime.combine(eval_day + timedelta(days=1), arr_time)

            blocked_start = entry_dt - buffer_delta
            blocked_end = exit_dt + buffer_delta

            occurrences.append(
                _MovementOccurrence(
                    movement=m,
                    train=train,
                    entry_dt=entry_dt,
                    exit_dt=exit_dt,
                    blocked_start=blocked_start,
                    blocked_end=blocked_end,
                    direction=direction,
                    is_vip=is_vip,
                )
            )

    # ── 2. Handle Case with Zero Train Movements ───────────────────────────
    effective_direction = req_direction or ("SINGLE" if is_single_line else "BOTH")
    if not occurrences:
        total_duration = horizon_days * 24 * 60
        if total_duration >= min_gap_minutes:
            return [
                CorridorGap(
                    id=uuid4(),
                    section_id=section_id,
                    target_date=target_date,
                    start_time=time(0, 0),
                    end_time=time(0, 0) if horizon_days == 1 else (horizon_end - timedelta(seconds=1)).time(),
                    start_datetime=horizon_start,
                    end_datetime=horizon_end,
                    duration_minutes=total_duration,
                    line_direction=effective_direction,
                    safety_buffer_minutes=safety_buffer_minutes,
                    has_vip_train_proximity=False,
                )
            ]
        return []

    # ── 3. Sort and Merge Blocked Intervals ────────────────────────────────
    occurrences.sort(key=lambda occ: (occ.blocked_start, occ.blocked_end))

    merged_blocks: List[_MergedBlockedInterval] = []
    for occ in occurrences:
        if not merged_blocks:
            merged_blocks.append(
                _MergedBlockedInterval(
                    start=occ.blocked_start,
                    end=occ.blocked_end,
                    occurrences=[occ],
                )
            )
        else:
            last = merged_blocks[-1]
            if occ.blocked_start <= last.end:
                # Overlapping or touching intervals: merge together
                last.end = max(last.end, occ.blocked_end)
                last.occurrences.append(occ)
            else:
                merged_blocks.append(
                    _MergedBlockedInterval(
                        start=occ.blocked_start,
                        end=occ.blocked_end,
                        occurrences=[occ],
                    )
                )

    # ── 4. Extract Unoccupied Corridor Gaps Between Blocked Windows ────────
    gaps: List[CorridorGap] = []

    # Gap before the first merged block
    first_block = merged_blocks[0]
    if first_block.start > horizon_start:
        gap_start_dt = horizon_start
        gap_end_dt = first_block.start
        # Find preceding train from yesterday if one exists
        prec_occ = None
        foll_occ = first_block.occurrences[0] if first_block.occurrences else None

        _add_gap_if_valid(
            gaps=gaps,
            section_id=section_id,
            target_date=target_date,
            gap_start_dt=gap_start_dt,
            gap_end_dt=gap_end_dt,
            min_gap_minutes=min_gap_minutes,
            safety_buffer_minutes=safety_buffer_minutes,
            line_direction=effective_direction,
            prec_occ=prec_occ,
            foll_occ=foll_occ,
            horizon_start=horizon_start,
            horizon_end=horizon_end,
        )

    # Gaps between consecutive merged blocks
    for i in range(len(merged_blocks) - 1):
        curr_block = merged_blocks[i]
        next_block = merged_blocks[i + 1]

        gap_start_dt = curr_block.end
        gap_end_dt = next_block.start

        if gap_end_dt > gap_start_dt:
            prec_occ = curr_block.occurrences[-1] if curr_block.occurrences else None
            foll_occ = next_block.occurrences[0] if next_block.occurrences else None

            _add_gap_if_valid(
                gaps=gaps,
                section_id=section_id,
                target_date=target_date,
                gap_start_dt=gap_start_dt,
                gap_end_dt=gap_end_dt,
                min_gap_minutes=min_gap_minutes,
                safety_buffer_minutes=safety_buffer_minutes,
                line_direction=effective_direction,
                prec_occ=prec_occ,
                foll_occ=foll_occ,
                horizon_start=horizon_start,
                horizon_end=horizon_end,
            )

    # Gap after the last merged block
    last_block = merged_blocks[-1]
    if last_block.end < horizon_end:
        gap_start_dt = last_block.end
        gap_end_dt = horizon_end
        prec_occ = last_block.occurrences[-1] if last_block.occurrences else None
        foll_occ = None

        _add_gap_if_valid(
            gaps=gaps,
            section_id=section_id,
            target_date=target_date,
            gap_start_dt=gap_start_dt,
            gap_end_dt=gap_end_dt,
            min_gap_minutes=min_gap_minutes,
            safety_buffer_minutes=safety_buffer_minutes,
            line_direction=effective_direction,
            prec_occ=prec_occ,
            foll_occ=foll_occ,
            horizon_start=horizon_start,
            horizon_end=horizon_end,
        )

    return gaps


def _add_gap_if_valid(
    gaps: List[CorridorGap],
    section_id: UUID,
    target_date: date,
    gap_start_dt: datetime,
    gap_end_dt: datetime,
    min_gap_minutes: int,
    safety_buffer_minutes: int,
    line_direction: str,
    prec_occ: Optional[_MovementOccurrence],
    foll_occ: Optional[_MovementOccurrence],
    horizon_start: datetime,
    horizon_end: datetime,
) -> None:
    """Helper to validate, compute VIP proximity, and construct a CorridorGap."""
    # Ensure the gap overlaps with the planning horizon
    if gap_end_dt <= horizon_start or gap_start_dt >= horizon_end:
        return

    duration_minutes = int((gap_end_dt - gap_start_dt).total_seconds() / 60)
    if duration_minutes < min_gap_minutes:
        return

    # Extract preceding train metadata
    prec_train = prec_occ.train if prec_occ else None
    prec_id, prec_num, prec_name, prec_type, prec_pri = _extract_train_info(prec_train)
    prec_is_vip = prec_occ.is_vip if prec_occ else False

    # Extract following train metadata
    foll_train = foll_occ.train if foll_occ else None
    foll_id, foll_num, foll_name, foll_type, foll_pri = _extract_train_info(foll_train)
    foll_is_vip = foll_occ.is_vip if foll_occ else False

    has_vip_proximity = prec_is_vip or foll_is_vip

    # For directional tagging: if preceding or following has specific direction, infer
    gap_direction = line_direction
    if gap_direction in ("BOTH", "SINGLE") and prec_occ and foll_occ:
        if prec_occ.direction == foll_occ.direction and prec_occ.direction in ("UP", "DOWN"):
            gap_direction = prec_occ.direction

    gap = CorridorGap(
        id=uuid4(),
        section_id=section_id,
        target_date=gap_start_dt.date(),
        start_time=gap_start_dt.time(),
        end_time=gap_end_dt.time(),
        start_datetime=gap_start_dt,
        end_datetime=gap_end_dt,
        duration_minutes=duration_minutes,
        line_direction=gap_direction,
        safety_buffer_minutes=safety_buffer_minutes,
        has_vip_train_proximity=has_vip_proximity,
        preceding_train_id=prec_id,
        preceding_train_number=prec_num,
        preceding_train_name=prec_name,
        preceding_train_type=prec_type,
        preceding_train_priority=prec_pri,
        following_train_id=foll_id,
        following_train_number=foll_num,
        following_train_name=foll_name,
        following_train_type=foll_type,
        following_train_priority=foll_pri,
    )
    gaps.append(gap)
