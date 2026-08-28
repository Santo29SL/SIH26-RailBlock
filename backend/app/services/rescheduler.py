"""Real-Time Fast Rescheduler and Single Line Working (SLW) Fallback Service.

Stage 6 Algorithmic Core for RailBlock (SIH PS 26027).

Performs event-driven greedy heuristic time-shifting (<1 ms) for live train delays >20 mins
without re-solving the global Google OR-Tools CP-SAT model, and automatically generates statutory
Temporary Single Line Working (TSLW) emergency advisory notices and Form T/D 602 support sheets under Indian Railways General and
Subsidiary Rules (GR 3.68 & Zonal SR Chapter 4/15) when an active maintenance block overruns with queued
passenger trains.

Canonical domain terminology strictly follows CONTEXT.md:
- Section: Distinct physical railway track segment between two consecutive block stations.
- Corridor Gap: Continuous time interval on a section during which no train movements occupy the track.
- Safety Buffer: Statutory minimum time headway enforced before and after train passage (>= 15 mins).
- Temporary Speed Restriction (TSR): Statutory caution order mandating reduced train velocity.
- Single Line Working (SLW): Emergency operational protocol under G&SR where trains move bidirectionally over a single track.
- Maintenance Request: Formal requisition submitted by engineering department (Track, Signal, Traction).
- Block / Joint Shadow Block: Officially granted possession window during which traffic is halted.
- Primary Block: The anchor maintenance activity governing the possession window.
- Shadow Activity: Secondary compatible maintenance task performed concurrently.
- Criticality Index (CI): Normalized score (0-100) representing defect urgency, safety hazard, and operational risk.
- G&SR (General and Subsidiary Rules): Binding statutory operating rulebook of Indian Railways.
- Form T/351: Statutory Indian Railways disconnection and reconnection notice document.
- Private Number (PN): Confidential unique numeric token exchanged between Station Master and Field Engineer.
"""

from __future__ import annotations

import enum
import time as _time
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union
from uuid import UUID, uuid4

from app.core.config import settings
from app.schemas.common import BlockStatusEnum, DepartmentEnum, LineTypeEnum, TrainPriorityEnum, TrainTypeEnum
from app.schemas.optimizer import ScheduledBlockSummary
from app.services.clustering import ShadowActivityAssignment
from app.services.optimizer import ScheduledBlock


# ── Domain Constants & Statutory References ──────────────────

DEFAULT_SAFETY_BUFFER_MINUTES: int = 15
TRAIN_DELAY_THRESHOLD_MINUTES: int = 20
BLOCK_OVERRUN_THRESHOLD_MINUTES: int = 15

# Statutory Speed Limits under GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15
SLW_FIRST_PILOT_MAX_SPEED_KMPH: int = 25
SLW_FACING_POINTS_MAX_SPEED_KMPH: int = 15
SLW_SUBSEQUENT_MAX_SPEED_KMPH: int = 40  # Booked speed (40 km/h automatic wrong-direction cap)

GSR_SLW_RULE_REFERENCE: str = (
    "GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15 — Temporary Single Line Working (TSLW) on Double Line"
)


def generate_td602_authority_sheet(
    section_code: str,
    section_name: Optional[str],
    obstructed_line: str,
    single_line_in_use: str,
    pilot_train_number: str,
    private_number: str,
    timestamp: datetime,
    division: Optional[str] = "Chennai",
    zone: Optional[str] = "Southern Railway",
) -> Dict[str, Any]:
    """Generate structured Form T/D 602 Authority to Proceed without Line Clear & Caution Order sheet."""
    station_code = section_code.split("-")[0] if "-" in section_code else section_code
    return {
        "form_name": "Form T/D 602",
        "form_title": "AUTHORITY FOR TEMPORARY SINGLE LINE WORKING ON DOUBLE LINE SECTION",
        "statutory_rule": "GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15",
        "division": division or "Chennai",
        "zone": zone or "Southern Railway",
        "section_code": section_code,
        "section_name": section_name or "Block Section",
        "date_time": timestamp.strftime("%Y-%m-%d %H:%M:%S IST"),
        "line_obstructed": obstructed_line,
        "line_in_use": single_line_in_use,
        "pilot_train_number": pilot_train_number,
        "station_master_private_number": private_number,
        "part_1_line_clear_ticket": f"Line Clear confirmed on {single_line_in_use} with Station Master PN {private_number}.",
        "part_2_authority_to_pass_signals_at_on": f"Driver authorized to pass Starter and Advanced Starter Signals at 'ON' into {single_line_in_use}.",
        "part_3_caution_order": {
            "pilot_train_speed": "25 km/h (Day/Night pilot speed ceiling)",
            "facing_points_speed": "15 km/h over all facing points and crossovers",
            "subsequent_train_speed": "Booked Speed (40 km/h cap if wrong direction on Automatic Block)",
            "clamping_padlocking_mandate": "All points leading to single line must be correctly set, clamped, and padlocked (SR 4.09).",
        },
    }


def generate_controller_phone_script(
    section_code: str,
    obstructed_line: str,
    single_line_in_use: str,
    pilot_train_number: str,
    private_number: str,
) -> str:
    """Generate verbatim Section Controller control-phone dispatch script for SLW."""
    return (
        f"[CONTROL PHONE SCRIPT - SECTION CONTROLLER TO ALL STATIONS {section_code}]\n"
        f"'ALL CONCERNED STATIONS TAKE NOTE: Maintenance block on {obstructed_line} has overran.\n"
        f"Temporary Single Line Working (TSLW) introduced on {single_line_in_use} under GR 3.68 and SR Chapter 15.\n"
        f"First Pilot Train is {pilot_train_number}, authorised under Form T/D 602 with Station Master PN {private_number}.\n"
        f"Speed: 25 km/h for first pilot train, 15 km/h over facing points. Regulate all freight in station sidings.'"
    )


# ── Action Classification Enum ───────────────────────────────


class RescheduleAction(str, enum.Enum):
    """Action category determined by the real-time fast rescheduler."""

    TIME_SHIFT = "TIME_SHIFT"
    SLW_ADVISORY = "SLW_ADVISORY"
    BUFFER_ABSORBED = "BUFFER_ABSORBED"
    SECTION_BLOCKADE = "SECTION_BLOCKADE"
    OVERRUN_WARNING = "OVERRUN_WARNING"
    NO_ACTION = "NO_ACTION"


# ── Frozen Domain Dataclasses ────────────────────────────────


@dataclass(frozen=True)
class SLWAdvisory:
    """Statutory Single Line Working (SLW) emergency advisory under GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15.

    Issued when an active maintenance possession overruns and delays queued trains,
    authorizing pilot-protected bidirectional train movement on the parallel line.
    """

    advisory_id: UUID
    timestamp: datetime
    gsr_rule_reference: str
    section_code: str
    section_name: Optional[str]
    obstructed_line: str
    single_line_in_use: str
    pilot_train_number: Optional[str]
    pilot_train_name: Optional[str]
    first_pilot_speed_kmph: int = SLW_FIRST_PILOT_MAX_SPEED_KMPH
    subsequent_train_speed_kmph: int = SLW_SUBSEQUENT_MAX_SPEED_KMPH
    facing_points_speed_kmph: int = SLW_FACING_POINTS_MAX_SPEED_KMPH
    freight_siding_orders: List[str] = field(default_factory=list)
    queued_train_priorities: List[str] = field(default_factory=list)
    private_number: Optional[str] = None
    advisory_text: str = ""
    td602_authority_sheet: Optional[Dict[str, Any]] = None
    controller_phone_script: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert SLWAdvisory to standard dictionary representation."""
        return {
            "advisory_id": str(self.advisory_id),
            "timestamp": self.timestamp.isoformat(),
            "gsr_rule_reference": self.gsr_rule_reference,
            "section_code": self.section_code,
            "section_name": self.section_name,
            "obstructed_line": self.obstructed_line,
            "single_line_in_use": self.single_line_in_use,
            "pilot_train_number": self.pilot_train_number,
            "pilot_train_name": self.pilot_train_name,
            "first_pilot_speed_kmph": self.first_pilot_speed_kmph,
            "subsequent_train_speed_kmph": self.subsequent_train_speed_kmph,
            "facing_points_speed_kmph": self.facing_points_speed_kmph,
            "freight_siding_orders": list(self.freight_siding_orders),
            "queued_train_priorities": list(self.queued_train_priorities),
            "private_number": self.private_number,
            "advisory_text": self.advisory_text,
            "td602_authority_sheet": self.td602_authority_sheet,
            "controller_phone_script": self.controller_phone_script,
        }


# Type alias for ScheduledBlock to satisfy ticket specification explicitly
ScheduledBlockPlan = ScheduledBlock


@dataclass(frozen=True)
class RescheduleOutcome:
    """Frozen outcome generated by the real-time fast rescheduler.

    Captures the decision (greedy shift, buffer absorption, or SLW fallback),
    the updated ScheduledBlock structure, and the statutory advisory details.
    """

    outcome_id: UUID
    action_taken: RescheduleAction
    success: bool
    delay_minutes: int
    is_block_overrun: bool
    has_queued_trains: bool
    original_start_time: time
    original_end_time: time
    new_start_time: Optional[time] = None
    new_end_time: Optional[time] = None
    original_start_datetime: Optional[datetime] = None
    original_end_datetime: Optional[datetime] = None
    new_start_datetime: Optional[datetime] = None
    new_end_datetime: Optional[datetime] = None
    shifted_block: Optional[ScheduledBlock] = None
    slw_advisory: Optional[SLWAdvisory] = None
    affected_trains_count: int = 0
    execution_time_ms: float = 0.0
    reason: str = ""
    advisory_notes: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert RescheduleOutcome to standard dictionary representation."""
        act_str = (
            self.action_taken.value
            if isinstance(self.action_taken, RescheduleAction)
            else str(self.action_taken)
        )
        return {
            "outcome_id": str(self.outcome_id),
            "action_taken": act_str,
            "success": self.success,
            "delay_minutes": self.delay_minutes,
            "is_block_overrun": self.is_block_overrun,
            "has_queued_trains": self.has_queued_trains,
            "original_start_time": self.original_start_time.isoformat(),
            "original_end_time": self.original_end_time.isoformat(),
            "new_start_time": self.new_start_time.isoformat() if self.new_start_time else None,
            "new_end_time": self.new_end_time.isoformat() if self.new_end_time else None,
            "original_start_datetime": (
                self.original_start_datetime.isoformat() if self.original_start_datetime else None
            ),
            "original_end_datetime": (
                self.original_end_datetime.isoformat() if self.original_end_datetime else None
            ),
            "new_start_datetime": (
                self.new_start_datetime.isoformat() if self.new_start_datetime else None
            ),
            "new_end_datetime": (
                self.new_end_datetime.isoformat() if self.new_end_datetime else None
            ),
            "shifted_block": self.shifted_block.to_dict() if self.shifted_block else None,
            "slw_advisory": self.slw_advisory.to_dict() if self.slw_advisory else None,
            "affected_trains_count": self.affected_trains_count,
            "execution_time_ms": round(self.execution_time_ms, 3),
            "reason": self.reason,
            "advisory_notes": list(self.advisory_notes),
        }


def _build_outcome(
    block: ScheduledBlock,
    t_start: float,
    action_taken: RescheduleAction,
    delay_minutes: int,
    is_block_overrun: bool,
    has_queued_trains: bool,
    reason: str,
    advisory_notes: List[str],
    new_start_time: Optional[time] = None,
    new_end_time: Optional[time] = None,
    new_start_datetime: Optional[datetime] = None,
    new_end_datetime: Optional[datetime] = None,
    shifted_block: Optional[ScheduledBlock] = None,
    slw_advisory: Optional[SLWAdvisory] = None,
    affected_trains_count: int = 0,
    success: bool = True,
) -> RescheduleOutcome:
    """Helper to eliminate outcome construction duplication and record execution time."""
    t_elapsed_ms = (_time.perf_counter() - t_start) * 1000.0
    return RescheduleOutcome(
        outcome_id=uuid4(),
        action_taken=action_taken,
        success=success,
        delay_minutes=delay_minutes,
        is_block_overrun=is_block_overrun,
        has_queued_trains=has_queued_trains,
        original_start_time=block.start_time,
        original_end_time=block.end_time,
        new_start_time=new_start_time,
        new_end_time=new_end_time,
        original_start_datetime=block.start_datetime,
        original_end_datetime=block.end_datetime,
        new_start_datetime=new_start_datetime,
        new_end_datetime=new_end_datetime,
        shifted_block=shifted_block,
        slw_advisory=slw_advisory,
        affected_trains_count=affected_trains_count,
        execution_time_ms=t_elapsed_ms,
        reason=reason,
        advisory_notes=advisory_notes,
    )



# ── Advisory Text Formatter ──────────────────────────────────


def format_slw_advisory_text(
    section_code: str,
    section_name: Optional[str],
    obstructed_line: str,
    single_line_in_use: str,
    timestamp: datetime,
    pilot_train_number: Optional[str],
    pilot_train_name: Optional[str],
    private_number: Optional[str],
    freight_siding_orders: Sequence[str],
    queued_train_priorities: Sequence[str],
    first_pilot_speed_kmph: int = SLW_FIRST_PILOT_MAX_SPEED_KMPH,
    subsequent_train_speed_kmph: int = SLW_SUBSEQUENT_MAX_SPEED_KMPH,
    facing_points_speed_kmph: int = SLW_FACING_POINTS_MAX_SPEED_KMPH,
    division: Optional[str] = None,
    zone: Optional[str] = None,
) -> str:
    """Generate pre-formatted statutory Indian Railways Single Line Working (SLW) notice.

    Adheres to the official operating advisory format mandated under GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15.
    """
    sec_display = f"{section_code}" + (f" ({section_name})" if section_name else "")
    div_display = (f"{division} Division, " if division else "") + (f"{zone}" if zone else "Indian Railways")
    pn_display = private_number or "PN-TO-BE-EXCHANGED"
    pilot_display = (
        f"{pilot_train_number}" + (f" ({pilot_train_name})" if pilot_train_name else "")
        if pilot_train_number
        else "First Pending High-Priority Express"
    )

    siding_text = "\n".join(f"      * {order}" for order in freight_siding_orders) if freight_siding_orders else "      * Regulate all freight rakes in adjacent station loops/sidings."
    queued_text = "\n".join(f"      * {trn}" for trn in queued_train_priorities) if queued_train_priorities else "      * All queued Tier-1/Tier-2 passenger services."

    return (
        "================================================================================\n"
        "INDIAN RAILWAYS - OPERATIONAL SAFETY ADVISORY (GR 3.68, SR 4.42, SR 4.09 & SR CH 15)\n"
        "SINGLE LINE WORKING (SLW) EMERGENCY AUTHORIZATION NOTICE\n"
        "================================================================================\n"
        f"ISSUING JURISDICTION : {div_display}\n"
        f"SECTION              : {sec_display}\n"
        f"ISSUED AT            : {timestamp.strftime('%Y-%m-%d %H:%M:%S IST')}\n"
        f"STATUTORY RULE       : {GSR_SLW_RULE_REFERENCE}\n"
        f"OBSTRUCTED TRACK     : {obstructed_line} (MAINTENANCE OVERRUN / BURST BLOCK)\n"
        f"OPERATIONAL TRACK    : {single_line_in_use} (BIDIRECTIONAL SLW IN EFFECT)\n"
        f"STATION MASTER PN    : {pn_display}\n"
        "--------------------------------------------------------------------------------\n"
        "1. PILOT TRAIN DISPATCH ORDER (GR 3.68 / SR Chapter 15):\n"
        f"   - Pilot Train Nominated : {pilot_display}\n"
        f"   - Movement Track        : {single_line_in_use} (Wrong Line Direction)\n"
        "   - Authorization         : Authority to Proceed without Line Clear (Form T/D 602 / T/A 602)\n"
        "   - Pilot Order           : Competent Railway Servant (Pilot Guard / Station Master Pilot)\n"
        "                             must accompany the first train.\n\n"
        "2. STATUTORY SPEED RESTRICTIONS (TSR / CAUTION ORDERS):\n"
        f"   - First Pilot Train Speed            : {first_pilot_speed_kmph} km/h (Caution Order Ceiling)\n"
        f"   - Over Facing Points & Crossovers    : {facing_points_speed_kmph} km/h\n"
        f"   - Subsequent Follow-Up Trains        : Booked Speed ({subsequent_train_speed_kmph} km/h wrong-direction cap on automatic block)\n"
        "   - Facing Points Clamping & Padlocking: Mandatory verification by Station Master.\n\n"
        "3. FREIGHT REGULATION & CONTROLLER DECISION SUPPORT:\n"
        f"{siding_text}\n\n"
        "4. QUEUED PASSENGER TRAIN REGULATION & PRIORITY:\n"
        f"{queued_text}\n\n"
        "5. RECONNECTION & CANCELLATION PROTOCOL:\n"
        "   - Normal Double Line Working shall only be resumed upon formal receipt of\n"
        "     Track Clearance and Reconnection Notice (Form T/351-B) accompanied by a valid\n"
        "     authenticating Station Master Private Number (PN).\n"
        "================================================================================"
    )


# ── Internal Block Normalization Helper ───────────────────────


def _normalize_to_scheduled_block(
    active_block: Union[ScheduledBlock, ScheduledBlockSummary, Dict[str, Any]],
    section_code: Optional[str] = None,
) -> ScheduledBlock:
    """Normalize input active_block into a canonical ScheduledBlock instance."""
    if isinstance(active_block, ScheduledBlock):
        return active_block

    if isinstance(active_block, ScheduledBlockSummary):
        # Convert ScheduledBlockSummary to ScheduledBlock
        today_date = active_block.block_date
        start_dt = datetime.combine(today_date, active_block.start_time)
        end_dt = datetime.combine(today_date, active_block.end_time)
        if end_dt <= start_dt:
            end_dt += timedelta(days=1)

        activities: List[ShadowActivityAssignment] = []
        for j in active_block.jobs:
            activities.append(
                ShadowActivityAssignment(
                    maintenance_request_id=j.maintenance_request_id,
                    request_code=j.request_code,
                    department=j.department,
                    activity_type=j.activity_type,
                    start_offset_minutes=j.start_offset_minutes,
                    end_offset_minutes=j.end_offset_minutes,
                    duration_minutes=j.duration_minutes,
                    criticality_index=j.criticality_index,
                    is_primary=j.is_primary,
                )
            )

        return ScheduledBlock(
            id=active_block.id or uuid4(),
            candidate_block_id=uuid4(),
            corridor_gap_id=uuid4(),
            section_id=active_block.section_id,
            section_code=section_code or active_block.section_code or "SEC-001",
            block_date=active_block.block_date,
            start_time=active_block.start_time,
            end_time=active_block.end_time,
            start_datetime=start_dt,
            end_datetime=end_dt,
            duration_minutes=active_block.duration_minutes,
            is_joint_shadow_block=active_block.is_joint_shadow_block,
            primary_department=active_block.primary_department,
            participating_departments=active_block.participating_departments,
            total_criticality_index=active_block.total_criticality_index,
            shadow_overlap_hours=active_block.shadow_overlap_hours,
            estimated_train_detention_minutes=active_block.estimated_train_detention_minutes,
            activities=activities,
            requests_covered_ids=[j.maintenance_request_id for j in active_block.jobs],
            status=active_block.status,
            block_code=active_block.block_code,
            optimizer_metadata=active_block.optimizer_metadata or {},
        )

    if isinstance(active_block, dict):
        # Convert dictionary to ScheduledBlock
        raw_b_date = active_block.get("block_date")
        if isinstance(raw_b_date, str):
            b_date = date.fromisoformat(raw_b_date)
        elif isinstance(raw_b_date, date):
            b_date = raw_b_date
        else:
            b_date = date.today()

        raw_st = active_block.get("start_time")
        if isinstance(raw_st, str):
            st_time = time.fromisoformat(raw_st)
        elif isinstance(raw_st, time):
            st_time = raw_st
        else:
            st_time = time(10, 0)

        raw_et = active_block.get("end_time")
        if isinstance(raw_et, str):
            et_time = time.fromisoformat(raw_et)
        elif isinstance(raw_et, time):
            et_time = raw_et
        else:
            et_time = time(12, 0)

        raw_sdt = active_block.get("start_datetime")
        if isinstance(raw_sdt, str):
            s_dt = datetime.fromisoformat(raw_sdt)
        elif isinstance(raw_sdt, datetime):
            s_dt = raw_sdt
        else:
            s_dt = datetime.combine(b_date, st_time)

        raw_edt = active_block.get("end_datetime")
        if isinstance(raw_edt, str):
            e_dt = datetime.fromisoformat(raw_edt)
        elif isinstance(raw_edt, datetime):
            e_dt = raw_edt
        else:
            e_dt = datetime.combine(b_date, et_time)
            if e_dt <= s_dt:
                e_dt += timedelta(days=1)

        duration = active_block.get("duration_minutes") or int((e_dt - s_dt).total_seconds() // 60)

        p_dept = active_block.get("primary_department", DepartmentEnum.TRACK)
        if isinstance(p_dept, str):
            p_dept = DepartmentEnum(p_dept)

        parts_raw = active_block.get("participating_departments", [p_dept])
        parts = [DepartmentEnum(d) if isinstance(d, str) else d for d in parts_raw]

        status_raw = active_block.get("status", BlockStatusEnum.PROPOSED)
        if isinstance(status_raw, str):
            status_val = BlockStatusEnum(status_raw)
        else:
            status_val = status_raw

        raw_id = active_block.get("id")
        block_id = UUID(raw_id) if isinstance(raw_id, str) else (raw_id or uuid4())

        sec_id_raw = active_block.get("section_id")
        sec_id = UUID(sec_id_raw) if isinstance(sec_id_raw, str) else (sec_id_raw or uuid4())

        # Extract activities
        acts: List[ShadowActivityAssignment] = []
        raw_acts = active_block.get("activities", [])
        for a in raw_acts:
            if isinstance(a, ShadowActivityAssignment):
                acts.append(a)
            elif isinstance(a, dict):
                r_id = a.get("maintenance_request_id") or a.get("request_id")
                acts.append(
                    ShadowActivityAssignment(
                        maintenance_request_id=UUID(r_id) if isinstance(r_id, str) else (r_id or uuid4()),
                        request_code=a.get("request_code", "MR-001"),
                        department=DepartmentEnum(a.get("department", "TRACK")),
                        activity_type=a.get("activity_type", "Track Maintenance"),
                        start_offset_minutes=a.get("start_offset_minutes", 0),
                        end_offset_minutes=a.get("end_offset_minutes", a.get("duration_minutes", duration)),
                        duration_minutes=a.get("duration_minutes", duration),
                        criticality_index=a.get("criticality_index", 50.0),
                        is_primary=a.get("is_primary", False),
                    )
                )

        req_ids_raw = active_block.get("requests_covered_ids", [])
        req_ids = [UUID(r) if isinstance(r, str) else r for r in req_ids_raw]
        if not req_ids and acts:
            req_ids = [a.maintenance_request_id for a in acts]

        return ScheduledBlock(
            id=block_id,
            candidate_block_id=uuid4(),
            corridor_gap_id=uuid4(),
            section_id=sec_id,
            section_code=section_code or active_block.get("section_code", "SEC-001"),
            block_date=b_date,
            start_time=st_time,
            end_time=et_time,
            start_datetime=s_dt,
            end_datetime=e_dt,
            duration_minutes=duration,
            is_joint_shadow_block=active_block.get("is_joint_shadow_block", False),
            primary_department=p_dept,
            participating_departments=parts,
            total_criticality_index=float(active_block.get("total_criticality_index", 0.0)),
            shadow_overlap_hours=float(active_block.get("shadow_overlap_hours", 0.0)),
            estimated_train_detention_minutes=int(active_block.get("estimated_train_detention_minutes", 0)),
            activities=acts,
            requests_covered_ids=req_ids,
            line_direction=active_block.get("line_direction", "BOTH"),
            traction_power_isolation=active_block.get("traction_power_isolation", False),
            feeding_post_section=active_block.get("feeding_post_section"),
            status=status_val,
            block_code=active_block.get("block_code"),
            optimizer_metadata=active_block.get("optimizer_metadata", {}),
        )

    raise TypeError(f"Unsupported active_block type: {type(active_block)}")


# ── Greedy Heuristic Time-Shift Engine ───────────────────────


def apply_greedy_time_shift(
    block: ScheduledBlock,
    shift_minutes: int,
) -> ScheduledBlock:
    """Apply greedy time-shifting to a ScheduledBlock and all internal shadow activities.

    Runs in microseconds (<1ms) without re-solving the global CP-SAT model.
    Preserves all activity relative start/end offsets and durations.
    """
    new_start_dt = block.start_datetime + timedelta(minutes=shift_minutes)
    new_end_dt = new_start_dt + timedelta(minutes=block.duration_minutes)

    # Shift shadow activities while maintaining relative offsets
    shifted_activities: List[ShadowActivityAssignment] = []
    for act in block.activities:
        shifted_act = ShadowActivityAssignment(
            maintenance_request_id=act.maintenance_request_id,
            request_code=act.request_code,
            department=act.department,
            activity_type=act.activity_type,
            start_offset_minutes=act.start_offset_minutes,
            end_offset_minutes=act.end_offset_minutes,
            duration_minutes=act.duration_minutes,
            criticality_index=act.criticality_index,
            is_primary=act.is_primary,
            id=act.id,
            resource_id=act.resource_id,
            start_km=act.start_km,
            end_km=act.end_km,
            feeding_post=act.feeding_post,
            power_isolation_required=act.power_isolation_required,
        )
        shifted_activities.append(shifted_act)


    updated_meta = dict(block.optimizer_metadata)
    updated_meta["last_rescheduled_at"] = datetime.now().isoformat()
    updated_meta["applied_shift_minutes"] = shift_minutes
    updated_meta["original_start_datetime"] = block.start_datetime.isoformat()
    updated_meta["original_end_datetime"] = block.end_datetime.isoformat()

    return ScheduledBlock(
        id=block.id,
        candidate_block_id=block.candidate_block_id,
        corridor_gap_id=block.corridor_gap_id,
        section_id=block.section_id,
        section_code=block.section_code,
        block_date=new_start_dt.date(),
        start_time=new_start_dt.time(),
        end_time=new_end_dt.time(),
        start_datetime=new_start_dt,
        end_datetime=new_end_dt,
        duration_minutes=block.duration_minutes,
        is_joint_shadow_block=block.is_joint_shadow_block,
        primary_department=block.primary_department,
        participating_departments=block.participating_departments,
        total_criticality_index=block.total_criticality_index,
        shadow_overlap_hours=block.shadow_overlap_hours,
        estimated_train_detention_minutes=block.estimated_train_detention_minutes + max(0, shift_minutes),
        activities=shifted_activities,
        requests_covered_ids=block.requests_covered_ids,
        line_direction=block.line_direction,
        traction_power_isolation=block.traction_power_isolation,
        feeding_post_section=block.feeding_post_section,
        status=block.status,
        block_code=block.block_code,
        optimizer_metadata=updated_meta,
    )


# ── Statutory SLW Advisory Generator ─────────────────────────


def generate_slw_advisory(
    section_code: str,
    section_name: Optional[str],
    line_direction: str,
    timestamp: datetime,
    pilot_train_number: Optional[str] = None,
    pilot_train_name: Optional[str] = None,
    queued_train_numbers: Optional[Sequence[str]] = None,
    freight_rakes_to_hold: Optional[Sequence[str]] = None,
    private_number: Optional[str] = None,
    division: Optional[str] = None,
    zone: Optional[str] = None,
) -> SLWAdvisory:
    """Construct an SLWAdvisory frozen dataclass under G&SR Chapter 5/15."""
    dir_upper = (line_direction or "UP").upper()
    if dir_upper.startswith("UP"):
        obstructed = "UP Main Line"
        single_in_use = "DOWN Main Line"
    elif dir_upper.startswith("DOWN"):
        obstructed = "DOWN Main Line"
        single_in_use = "UP Main Line"
    else:
        obstructed = "UP Line (Track 1)"
        single_in_use = "DOWN Line (Track 2)"

    pn_str = private_number or f"PN-{uuid4().hex[:4].upper()}"

    siding_orders: List[str] = []
    if freight_rakes_to_hold:
        for rake in freight_rakes_to_hold:
            siding_orders.append(
                f"Regulate Freight Rake {rake} in station siding/loop line at boundary block station."
            )
    else:
        siding_orders.append("Hold all Tier-3 Freight rakes in outer station loops/sidings until SLW cancellation.")
        siding_orders.append("Do not dispatch Goods rakes into single line block section.")

    queued_list: List[str] = []
    if queued_train_numbers:
        for t_num in queued_train_numbers:
            queued_list.append(f"Train {t_num} (Scheduled for priority single-line pilot clearance)")
    elif pilot_train_number:
        queued_list.append(
            f"Train {pilot_train_number}"
            + (f" ({pilot_train_name})" if pilot_train_name else "")
            + " (Pilot Passenger Train)"
        )
    else:
        queued_list.append("All scheduled passenger services queued at adjacent block stations.")

    advisory_txt = format_slw_advisory_text(
        section_code=section_code,
        section_name=section_name,
        obstructed_line=obstructed,
        single_line_in_use=single_in_use,
        timestamp=timestamp,
        pilot_train_number=pilot_train_number,
        pilot_train_name=pilot_train_name,
        private_number=pn_str,
        freight_siding_orders=siding_orders,
        queued_train_priorities=queued_list,
        first_pilot_speed_kmph=SLW_FIRST_PILOT_MAX_SPEED_KMPH,
        subsequent_train_speed_kmph=SLW_SUBSEQUENT_MAX_SPEED_KMPH,
        facing_points_speed_kmph=SLW_FACING_POINTS_MAX_SPEED_KMPH,
        division=division,
        zone=zone,
    )

    td602 = generate_td602_authority_sheet(
        section_code=section_code,
        section_name=section_name,
        obstructed_line=obstructed,
        single_line_in_use=single_in_use,
        pilot_train_number=pilot_train_number or "12621",
        private_number=pn_str,
        timestamp=timestamp,
        division=division or "Chennai",
        zone=zone or "Southern Railway",
    )

    script = generate_controller_phone_script(
        section_code=section_code,
        obstructed_line=obstructed,
        single_line_in_use=single_in_use,
        pilot_train_number=pilot_train_number or "12621",
        private_number=pn_str,
    )

    return SLWAdvisory(
        advisory_id=uuid4(),
        timestamp=timestamp,
        gsr_rule_reference=GSR_SLW_RULE_REFERENCE,
        section_code=section_code,
        section_name=section_name,
        obstructed_line=obstructed,
        single_line_in_use=single_in_use,
        pilot_train_number=pilot_train_number,
        pilot_train_name=pilot_train_name,
        first_pilot_speed_kmph=SLW_FIRST_PILOT_MAX_SPEED_KMPH,
        subsequent_train_speed_kmph=SLW_SUBSEQUENT_MAX_SPEED_KMPH,
        facing_points_speed_kmph=SLW_FACING_POINTS_MAX_SPEED_KMPH,
        freight_siding_orders=siding_orders,
        queued_train_priorities=queued_list,
        private_number=pn_str,
        advisory_text=advisory_txt,
        td602_authority_sheet=td602,
        controller_phone_script=script,
    )


# ── Main Entrypoint: reschedule_on_disruption ────────────────


def reschedule_on_disruption(
    active_block: Union[ScheduledBlock, ScheduledBlockSummary, Dict[str, Any]],
    delay_minutes: int,
    impacted_train_number: str,
    is_block_overrun: bool = False,
    has_queued_trains: bool = False,
    impacted_train_name: Optional[str] = None,
    impacted_train_priority: Optional[TrainPriorityEnum] = None,
    impacted_train_type: Optional[TrainTypeEnum] = None,
    parallel_line_available: bool = True,
    line_type: LineTypeEnum = LineTypeEnum.DOUBLE,
    section_code: Optional[str] = None,
    section_name: Optional[str] = None,
    division: Optional[str] = None,
    zone: Optional[str] = None,
    queued_train_numbers: Optional[List[str]] = None,
    freight_rakes_to_hold: Optional[List[str]] = None,
    pilot_train_number: Optional[str] = None,
    private_number: Optional[str] = None,
    reason: Optional[str] = None,
) -> RescheduleOutcome:
    """Evaluate a live disruption and execute real-time rescheduling or SLW fallback.

    Acceptance Criteria:
    - Shifts block start/end times in <1s for live train delays >20 mins without global CP-SAT re-solve.
    - Absorbs delays <= 20 mins into statutory safety buffers without disrupting the block schedule.
    - Triggers Indian Railways GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15 Single Line Working (SLW) fallback advisory
      for maintenance block overruns (+15 mins past granted window) with queued trains.
    - Outputs pre-formatted statutory advisory text specifying pilot train dispatch, Speed
      Caps (25 km/h Pilot / 15 km/h Facing Points / Booked Speed subsequent), freight regulation advisory, and SM Private Numbers.

    Returns:
        RescheduleOutcome frozen dataclass.
    """
    t_start = _time.perf_counter()
    outcome_id = uuid4()
    now_dt = datetime.now()

    # 1. Normalize active_block to canonical ScheduledBlock
    block = _normalize_to_scheduled_block(active_block, section_code=section_code)
    effective_sec_code = section_code or block.section_code or "SEC-001"

    # Default train info if not provided
    trn_display = (
        f"{impacted_train_number}" + (f" ({impacted_train_name})" if impacted_train_name else "")
    )

    # 2. Evaluate Block Overrun Disruption
    if is_block_overrun:
        # Check if overrun has reached the statutory threshold (+15 mins) with queued trains
        if delay_minutes >= BLOCK_OVERRUN_THRESHOLD_MINUTES and has_queued_trains:
            if parallel_line_available and line_type != LineTypeEnum.SINGLE:
                slw = generate_slw_advisory(
                    section_code=effective_sec_code,
                    section_name=section_name,
                    line_direction=block.line_direction,
                    timestamp=now_dt,
                    pilot_train_number=pilot_train_number or impacted_train_number,
                    pilot_train_name=impacted_train_name,
                    queued_train_numbers=queued_train_numbers,
                    freight_rakes_to_hold=freight_rakes_to_hold,
                    private_number=private_number,
                    division=division,
                    zone=zone,
                )

                notes = [
                    f"Maintenance Block overrun (+{delay_minutes} mins) with queued train(s) detected.",
                    "Emergency Single Line Working (SLW) authorized on parallel track under G&SR Chapter 5/15.",
                    f"Pilot Train {slw.pilot_train_number or impacted_train_number} dispatched with 25 km/h MPS caution order.",
                    "Facing points / crossovers speed ceiling enforced at 15 km/h.",
                    "All freight rakes held in station sidings to clear single line for passenger runs.",
                    f"Station Master Private Number: {slw.private_number}.",
                ]

                return _build_outcome(
                    block=block,
                    t_start=t_start,
                    action_taken=RescheduleAction.SLW_ADVISORY,
                    delay_minutes=delay_minutes,
                    is_block_overrun=True,
                    has_queued_trains=True,
                    slw_advisory=slw,
                    affected_trains_count=len(queued_train_numbers or [impacted_train_number]),
                    reason=(
                        reason
                        or f"Block overrun (+{delay_minutes} mins) on {effective_sec_code} with queued passenger trains. "
                        "Triggered statutory Single Line Working (SLW) on parallel track under G&SR Chapter 5/15."
                    ),
                    advisory_notes=notes,
                )
            else:
                # Single line topology: SLW physically impossible; trigger Section Blockade
                notes = [
                    f"CRITICAL: Block overrun (+{delay_minutes} mins) on SINGLE line section {effective_sec_code}.",
                    "Parallel line is NOT available for Single Line Working (SLW).",
                    "All approaching passenger and freight trains must be detained at outer block stations.",
                    "Emergency breakdown team dispatched to clear track immediately.",
                ]
                return _build_outcome(
                    block=block,
                    t_start=t_start,
                    action_taken=RescheduleAction.SECTION_BLOCKADE,
                    delay_minutes=delay_minutes,
                    is_block_overrun=True,
                    has_queued_trains=True,
                    affected_trains_count=len(queued_train_numbers or [impacted_train_number]),
                    reason=(
                        reason
                        or f"Single-track section blockade due to block overrun (+{delay_minutes} mins). "
                        "SLW not possible on single line; approaching traffic detained at outer stations."
                    ),
                    advisory_notes=notes,
                )
        elif has_queued_trains:
            # Overrun < 15 mins with queued trains: monitor priority trains before escalating to SLW
            notes = [
                f"Maintenance Block overrun (+{delay_minutes} mins) below statutory +{BLOCK_OVERRUN_THRESHOLD_MINUTES} min SLW threshold.",
                "Approaching train(s) queued at section boundaries; Section Controller alerted for expedited clearance.",
                f"Emergency SLW protocol on standby if overrun reaches +{BLOCK_OVERRUN_THRESHOLD_MINUTES} minutes.",
            ]
            return _build_outcome(
                block=block,
                t_start=t_start,
                action_taken=RescheduleAction.OVERRUN_WARNING,
                delay_minutes=delay_minutes,
                is_block_overrun=True,
                has_queued_trains=True,
                affected_trains_count=len(queued_train_numbers or [impacted_train_number]),
                reason=(
                    reason
                    or f"Block overrun (+{delay_minutes} mins) on {effective_sec_code} with queued train(s). "
                    f"Monitoring status prior to statutory +{BLOCK_OVERRUN_THRESHOLD_MINUTES} min SLW threshold."
                ),
                advisory_notes=notes,
            )
        else:
            # Overrun without queued trains: Issue overrun warning & extension notice
            notes = [
                f"Maintenance Block overrunning by {delay_minutes} minutes.",
                "No queued passenger trains currently detained at section boundaries.",
                "Section Controller notified. Monitoring section occupancy.",
            ]
            return _build_outcome(
                block=block,
                t_start=t_start,
                action_taken=RescheduleAction.OVERRUN_WARNING,
                delay_minutes=delay_minutes,
                is_block_overrun=True,
                has_queued_trains=False,
                affected_trains_count=0,
                reason=(
                    reason
                    or f"Block overrun (+{delay_minutes} mins) on {effective_sec_code} without immediate train conflicts. "
                    "Overrun warning logged; awaiting engineering clearance."
                ),
                advisory_notes=notes,
            )

    # 3. Evaluate Train Delay Disruption (> 20 mins -> Greedy Time Shift)
    if delay_minutes > TRAIN_DELAY_THRESHOLD_MINUTES:
        shifted = apply_greedy_time_shift(block, delay_minutes)

        notes = [
            f"Train {trn_display} delayed by {delay_minutes} mins (> {TRAIN_DELAY_THRESHOLD_MINUTES} min threshold).",
            "Greedy time-shift applied without global CP-SAT re-solve.",
            f"Block schedule shifted from {block.start_time.strftime('%H:%M')}–{block.end_time.strftime('%H:%M')} "
            f"to {shifted.start_time.strftime('%H:%M')}–{shifted.end_time.strftime('%H:%M')}.",
            f"All {len(shifted.activities)} internal shadow activities preserved with original durations and relative offsets.",
        ]

        return _build_outcome(
            block=block,
            t_start=t_start,
            action_taken=RescheduleAction.TIME_SHIFT,
            delay_minutes=delay_minutes,
            is_block_overrun=False,
            has_queued_trains=has_queued_trains,
            new_start_time=shifted.start_time,
            new_end_time=shifted.end_time,
            new_start_datetime=shifted.start_datetime,
            new_end_datetime=shifted.end_datetime,
            shifted_block=shifted,
            affected_trains_count=1,
            reason=(
                reason
                or f"Train {trn_display} delay of {delay_minutes} mins shifted block {block.block_code or 'BLK'} "
                f"by +{delay_minutes} mins on {effective_sec_code}."
            ),
            advisory_notes=notes,
        )

    # 4. Minor Delay (0 < delay_minutes <= 20 mins -> Safety Buffer Absorbed)
    if 0 < delay_minutes <= TRAIN_DELAY_THRESHOLD_MINUTES:
        notes = [
            f"Train {trn_display} delay of {delay_minutes} mins is within statutory safety buffer threshold (<= {TRAIN_DELAY_THRESHOLD_MINUTES} mins).",
            "Headway variance absorbed by statutory buffer (>= 15 mins).",
            "No time shift of Block schedule required.",
        ]
        return _build_outcome(
            block=block,
            t_start=t_start,
            action_taken=RescheduleAction.BUFFER_ABSORBED,
            delay_minutes=delay_minutes,
            is_block_overrun=False,
            has_queued_trains=has_queued_trains,
            new_start_time=block.start_time,
            new_end_time=block.end_time,
            new_start_datetime=block.start_datetime,
            new_end_datetime=block.end_datetime,
            shifted_block=block,
            affected_trains_count=1,
            reason=(
                reason
                or f"Train {trn_display} delay of {delay_minutes} mins safely absorbed by standard safety buffer. "
                "No schedule adjustment required."
            ),
            advisory_notes=notes,
        )

    # 5. Zero or Negative Delay (No Action)
    return _build_outcome(
        block=block,
        t_start=t_start,
        action_taken=RescheduleAction.NO_ACTION,
        delay_minutes=delay_minutes,
        is_block_overrun=False,
        has_queued_trains=False,
        new_start_time=block.start_time,
        new_end_time=block.end_time,
        new_start_datetime=block.start_datetime,
        new_end_datetime=block.end_datetime,
        shifted_block=block,
        affected_trains_count=0,
        reason=reason or "On-time operation. No disruption detected.",
        advisory_notes=["Section operating within normal timetable tolerances."],
    )

