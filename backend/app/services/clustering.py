"""Multi-Department Shadow Block Clustering and G&SR Safety Rules Engine.

Stage 4 Algorithmic Core for RailBlock (SIH PS 26027).

Groups pending Maintenance Requests from Track (TMS), Signal (SMMS), and Traction (TDMS)
into candidate Joint Shadow Blocks within <= 10 km spatial boundaries and Substation FP/SP
power isolations, strictly evaluating G&SR safety conflict rules to reject incompatible
activities while scheduling flexible internal Shadow Activity offsets.

Domain terminology strictly follows CONTEXT.md:
- Section: Track segment between two consecutive block stations.
- Feeding Post (FP) / Sectioning Post (SP): Substation traction switching installations defining electrical isolation boundaries.
- Joint Shadow Block: Consolidated block that executes multiple compatible maintenance requests from different departments concurrently within a single traffic block.
- Primary Block: The anchor maintenance activity whose duration and spatial limits define the overall corridor window.
- Shadow Activity: Secondary compatible maintenance task performed concurrently within the temporal boundaries of a Primary Block.
- Criticality Index (CI): Normalized score (0-100) representing urgency, safety hazard, and operational risk.
- G&SR (General & Subsidiary Rules): Indian Railways statutory operating safety rulebook.
"""

from __future__ import annotations

import itertools
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple
from uuid import UUID, uuid4

from app.core.config import settings
from app.schemas.common import DepartmentEnum, LineTypeEnum, PriorityEnum


# ── Built-in Standard Indian Railways G&SR Compatibility Knowledge Base ─────

# Format: (Dept A, Activity Pattern A, Dept B, Activity Pattern B, is_compatible, reason)
DEFAULT_GSR_RULES: List[Tuple[str, str, str, str, bool, str]] = [
    # ── Track vs Track ──
    ("TRACK", "Machine Tamping", "TRACK", "Dynamic Track Stabilization", True, "DTS follows tamping in standard procedure"),
    ("TRACK", "Machine Tamping", "TRACK", "Gauge Correction", True, "Compatible in same track possession"),
    ("TRACK", "Machine Tamping", "TRACK", "Rail Grinding (RGM)", False, "Multiple heavy track machines cannot operate simultaneously on same section"),
    ("TRACK", "Ballast Cleaning (BCM)", "TRACK", "Rail Grinding (RGM)", False, "Heavy track machine conflict"),
    ("TRACK", "USFD Rail Inspection", "TRACK", "Manual Spot Packing", True, "Inspection and minor track work compatible"),

    # ── Track vs Signal ──
    ("TRACK", "Machine Tamping", "SIGNAL", "Point Machine Overhaul", False, "Tamping near points requires interlocking to be locked; high vibration hazard"),
    ("TRACK", "Machine Tamping", "SIGNAL", "Point Machine Testing", False, "Tamping disturbs point detection mechanisms"),
    ("TRACK", "Machine Tamping", "SIGNAL", "Signal Cable Replacement", True, "Cable laying alongside tamping permitted in segregated sub-sections"),
    ("TRACK", "USFD Rail Inspection", "SIGNAL", "Axle Counter Calibration", True, "Non-destructive inspections compatible"),
    ("TRACK", "USFD Rail Inspection", "SIGNAL", "Track Circuit Maintenance", True, "Inspection does not disrupt circuit testing"),
    ("TRACK", "Ballast Cleaning (BCM)", "SIGNAL", "Track Circuit Maintenance", False, "BCM excavation damages bond wires and track circuit boots"),
    ("TRACK", "Rail Destressing (LWR/CWR)", "SIGNAL", "Point Machine Overhaul", False, "Track thermal movement disrupts point geometry"),

    # ── Track vs Traction ──
    ("TRACK", "Machine Tamping", "TRACTION", "OHE Wire Adjustment", False, "Safety hazard: OHE adjustment requires power isolation with tower wagon conflict"),
    ("TRACK", "USFD Rail Inspection", "TRACTION", "Pantograph Clearance Check", True, "Independent non-invasive inspections"),
    ("TRACK", "Rail Destressing (LWR/CWR)", "TRACTION", "OHE Wire Adjustment", False, "Simultaneous track lifting and OHE height adjustment prohibited"),
    ("TRACK", "Manual Spot Packing", "TRACTION", "Earthing/Bonding Check", True, "Minor maintenance compatible"),
    ("TRACK", "Thermit/Flash Butt Welding", "TRACTION", "OHE Wire Adjustment", False, "High-temperature welding fumes and equipment proximity hazard under OHE"),

    # ── Signal vs Traction ──
    ("SIGNAL", "Relay Room Maintenance", "TRACTION", "SCADA System Maintenance", True, "Indoor control system maintenance fully compatible"),
    ("SIGNAL", "Point Machine Overhaul", "TRACTION", "OHE Wire Adjustment", True, "Coordination permitted between S&T point overhaul and OHE adjustment"),
    ("SIGNAL", "Signal Cable Replacement", "TRACTION", "Feeder Line Maintenance", False, "High-voltage cable interference and induction hazards"),
    ("SIGNAL", "Interlocking Testing", "TRACTION", "Sub-Station Power Check", False, "Interlocking test requires stable guaranteed supply"),

    # ── Signal vs Signal ──
    ("SIGNAL", "Relay Room Maintenance", "SIGNAL", "Block Instrument Testing", True, "Routine S&T indoor testing"),
    ("SIGNAL", "Point Machine Overhaul", "SIGNAL", "Interlocking Testing", False, "Cannot test interlocking logic while physical points are disconnected"),

    # ── Traction vs Traction ──
    ("TRACTION", "OHE Wire Adjustment", "TRACTION", "Insulator Cleaning/Replacement", True, "Compatible OHE tower wagon maintenance"),
    ("TRACTION", "OHE Wire Adjustment", "TRACTION", "Sub-Station Power Check", False, "Power check requires live feed; OHE work requires isolation"),
]


# ── Domain Data Structures (Frozen Dataclasses) ─────────────


@dataclass(frozen=True)
class ShadowActivityAssignment:
    """An individual maintenance activity scheduled inside a candidate Block."""

    maintenance_request_id: UUID
    request_code: str
    department: DepartmentEnum
    activity_type: str
    duration_minutes: int
    start_offset_minutes: int
    end_offset_minutes: int
    criticality_index: float
    is_primary: bool
    id: Optional[UUID] = None
    resource_id: Optional[UUID] = None
    start_km: Optional[float] = None
    end_km: Optional[float] = None
    feeding_post: Optional[str] = None
    power_isolation_required: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert assignment to standard dictionary."""
        dept_val = self.department.value if hasattr(self.department, "value") else str(self.department)
        return {
            "id": str(self.id) if self.id else None,
            "maintenance_request_id": str(self.maintenance_request_id),
            "request_code": self.request_code,
            "department": dept_val,
            "activity_type": self.activity_type,
            "duration_minutes": self.duration_minutes,
            "start_offset_minutes": self.start_offset_minutes,
            "end_offset_minutes": self.end_offset_minutes,
            "criticality_index": self.criticality_index,
            "is_primary": self.is_primary,
            "resource_id": str(self.resource_id) if self.resource_id else None,
            "start_km": self.start_km,
            "end_km": self.end_km,
            "feeding_post": self.feeding_post,
            "power_isolation_required": self.power_isolation_required,
        }


@dataclass(frozen=True)
class CandidateShadowBlock:
    """A candidate single or joint maintenance block generated by the clustering engine.

    Represents a candidate possession window that can be assigned to an unoccupied
    corridor gap by the Stage 5 CP-SAT solver.
    """

    id: UUID
    section_id: UUID
    primary_request_id: UUID
    primary_department: DepartmentEnum
    primary_activity: str
    duration_minutes: int
    section_code: Optional[str] = None
    is_joint_shadow_block: bool = False
    participating_departments: List[DepartmentEnum] = field(default_factory=list)
    total_criticality_index: float = 0.0
    shadow_overlap_hours: float = 0.0
    activities: List[ShadowActivityAssignment] = field(default_factory=list)
    traction_power_isolation: bool = False
    feeding_post_section: Optional[str] = None
    requests_covered_ids: List[UUID] = field(default_factory=list)
    line_direction: str = "BOTH"

    def has_department(self, department: DepartmentEnum | str) -> bool:
        """Check if a specific department is participating in this candidate block."""
        target_str = department.value if hasattr(department, "value") else str(department).upper()
        for d in self.participating_departments:
            d_str = d.value if hasattr(d, "value") else str(d).upper()
            if d_str == target_str:
                return True
        return False

    def contains_request(self, request_id: UUID) -> bool:
        """Check if a specific maintenance request ID is included in this block."""
        return request_id in self.requests_covered_ids

    @property
    def resource_ids(self) -> Set[UUID]:
        """Extract all resource UUIDs required by activities in this candidate block."""
        return {act.resource_id for act in self.activities if act.resource_id is not None}

    def to_dict(self) -> Dict[str, Any]:
        """Convert CandidateShadowBlock to a standard dictionary representation."""
        prim_dept = (
            self.primary_department.value
            if hasattr(self.primary_department, "value")
            else str(self.primary_department)
        )
        parts = [
            (d.value if hasattr(d, "value") else str(d))
            for d in self.participating_departments
        ]
        return {
            "id": str(self.id),
            "section_id": str(self.section_id),
            "section_code": self.section_code,
            "primary_request_id": str(self.primary_request_id),
            "primary_department": prim_dept,
            "primary_activity": self.primary_activity,
            "duration_minutes": self.duration_minutes,
            "is_joint_shadow_block": self.is_joint_shadow_block,
            "participating_departments": parts,
            "total_criticality_index": self.total_criticality_index,
            "shadow_overlap_hours": self.shadow_overlap_hours,
            "traction_power_isolation": self.traction_power_isolation,
            "feeding_post_section": self.feeding_post_section,
            "requests_covered_ids": [str(rid) for rid in self.requests_covered_ids],
            "line_direction": self.line_direction,
            "activities": [a.to_dict() for a in self.activities],
        }


# ── Helper Utilities for Request Parsing ─────────────────────


def _normalize_dept_enum(dept: Any) -> DepartmentEnum:
    """Normalize department input to DepartmentEnum."""
    if isinstance(dept, DepartmentEnum):
        return dept
    dept_str = str(dept.value if hasattr(dept, "value") else dept).upper()
    if "TRACK" in dept_str or "ENG" in dept_str or "TMS" in dept_str:
        return DepartmentEnum.TRACK
    if "SIG" in dept_str or "S&T" in dept_str or "SMMS" in dept_str:
        return DepartmentEnum.SIGNAL
    if "TRAC" in dept_str or "TRD" in dept_str or "TDMS" in dept_str or "ELEC" in dept_str:
        return DepartmentEnum.TRACTION
    return DepartmentEnum.TRACK


def _get_metadata_dict(request: Any) -> Dict[str, Any]:
    """Safely extract metadata dictionary from a maintenance request object."""
    meta = getattr(request, "metadata_json", None)
    if meta is None:
        meta = getattr(request, "metadata", None)
    if isinstance(meta, dict):
        return meta
    return {}


def _get_chainage_range(request: Any) -> Tuple[Optional[float], Optional[float]]:
    """Extract and normalize start_km and end_km so start_km <= end_km."""
    meta = _get_metadata_dict(request)
    start_km = getattr(request, "start_km", None) or meta.get("start_km")
    end_km = getattr(request, "end_km", None) or meta.get("end_km")

    if start_km is None and "chainage_km" in meta:
        start_km = meta.get("chainage_km")
        end_km = meta.get("chainage_km")

    try:
        if start_km is not None and end_km is not None:
            s, e = float(start_km), float(end_km)
            return min(s, e), max(s, e)
        elif start_km is not None:
            s = float(start_km)
            return s, s
        return None, None
    except (ValueError, TypeError):
        return None, None


def _get_power_isolation_info(request: Any) -> Tuple[bool, Optional[str]]:
    """Extract traction power isolation requirement and FP/SP boundary code."""
    meta = _get_metadata_dict(request)
    power_iso = bool(
        getattr(request, "power_isolation_required", False)
        or meta.get("power_isolation_required", False)
        or meta.get("ohe_power_block", False)
    )
    fp = getattr(request, "feeding_post", None) or meta.get("feeding_post") or meta.get("fp_sp_boundary")
    if fp:
        fp = str(fp).strip().upper()
    return power_iso, fp


# ── Criticality Index (CI) Calculator ────────────────────────


def compute_criticality_index(
    request: Any,
    target_date: Optional[date] = None,
) -> float:
    """Compute the dynamic Criticality Index (0-100) for a maintenance request.

    Formula under Stage 2 / Master Specification:
        CI = w1 * TGI_Deviation + w2 * Delta_v_TSR + w3 * DaysOverdue + w4 * SectionGMTDensity

    If explicit score is present in metadata, it is utilized directly.
    Otherwise, evaluates metric components or falls back to standard priority baseline.
    """
    meta = _get_metadata_dict(request)

    # 1. Direct explicit score if provided
    for key in ("criticality_index", "criticality_score", "safety_risk_index", "ci"):
        if key in meta and meta[key] is not None:
            try:
                val = float(meta[key])
                if val <= 10.0 and val > 0.0 and "index" in key:
                    val = val * 10.0
                return round(min(100.0, max(0.0, val)), 2)
            except (ValueError, TypeError):
                pass

    direct_ci = getattr(request, "criticality_index", None)
    if direct_ci is not None:
        try:
            return round(min(100.0, max(0.0, float(direct_ci))), 2)
        except (ValueError, TypeError):
            pass

    # 2. Metric-based weighted formula
    has_formula_metrics = any(
        k in meta
        for k in (
            "tgi_deviation",
            "tgi",
            "speed_restriction_delta",
            "speed_restriction_kmh",
            "days_overdue",
            "section_gmt_density",
            "section_gmt",
        )
    )

    if has_formula_metrics:
        # TGI component (0-100)
        tgi_val = meta.get("tgi_deviation", meta.get("tgi", 50.0))
        try:
            s_tgi = min(100.0, max(0.0, float(tgi_val)))
        except (ValueError, TypeError):
            s_tgi = 50.0

        # TSR Speed restriction component (0-100)
        tsr_val = meta.get("speed_restriction_delta", meta.get("speed_restriction_kmh", 30.0))
        try:
            s_tsr = min(100.0, max(0.0, float(tsr_val)))
        except (ValueError, TypeError):
            s_tsr = 30.0

        # Days overdue component (0-100)
        days_overdue = meta.get("days_overdue")
        if days_overdue is None:
            deadline = getattr(request, "deadline", None)
            if deadline and target_date:
                diff = (target_date - deadline).days
                days_overdue = max(0, diff)
            else:
                days_overdue = 0
        try:
            s_overdue = min(100.0, max(0.0, float(days_overdue) * 10.0))
        except (ValueError, TypeError):
            s_overdue = 0.0

        # GMT density component (0-100)
        gmt_val = meta.get("section_gmt_density", meta.get("section_gmt", 50.0))
        try:
            s_gmt = min(100.0, max(0.0, float(gmt_val)))
        except (ValueError, TypeError):
            s_gmt = 50.0

        w_tgi = settings.CRITICALITY_WEIGHT_TGI
        w_tsr = settings.CRITICALITY_WEIGHT_TSR
        w_overdue = settings.CRITICALITY_WEIGHT_OVERDUE
        w_gmt = settings.CRITICALITY_WEIGHT_GMT

        ci = (w_tgi * s_tgi) + (w_tsr * s_tsr) + (w_overdue * s_overdue) + (w_gmt * s_gmt)
        return round(min(100.0, max(0.0, ci)), 2)

    # 3. Priority fallback baseline
    prio = getattr(request, "priority", PriorityEnum.MEDIUM)
    prio_str = str(prio.value if hasattr(prio, "value") else prio).upper()

    base_ci_map = {
        "CRITICAL": 90.0,
        "HIGH": 75.0,
        "MEDIUM": 50.0,
        "LOW": 25.0,
    }
    ci = base_ci_map.get(prio_str, 50.0)

    # Apply minor overdue bonus if deadline passed
    deadline = getattr(request, "deadline", None)
    if deadline and target_date and target_date > deadline:
        overdue_days = (target_date - deadline).days
        ci = min(100.0, ci + min(10.0, overdue_days * 2.0))

    return round(ci, 2)


# ── G&SR Safety Rules Engine ─────────────────────────────────


def _matches_rule(
    dept_a: str,
    act_a: str,
    dept_b: str,
    act_b: str,
    r_dept_a: str,
    r_act_a: str,
    r_dept_b: str,
    r_act_b: str,
    exact_match: bool = False,
) -> bool:
    """Helper to check bidirectional match between two activity pairs and a rule."""
    def act_match(target: str, pattern: str) -> bool:
        if exact_match:
            return target.lower() == pattern.lower()
        return target.lower() == pattern.lower() or pattern.lower() in target.lower()

    # Forward
    if dept_a == r_dept_a and dept_b == r_dept_b and act_match(act_a, r_act_a) and act_match(act_b, r_act_b):
        return True
    # Reverse
    if dept_a == r_dept_b and dept_b == r_dept_a and act_match(act_a, r_act_b) and act_match(act_b, r_act_a):
        return True

    return False


def is_pair_compatible(
    req_a: Any,
    req_b: Any,
    compatibility_rules: Optional[Sequence[Any]] = None,
) -> bool:
    """Evaluate whether two maintenance requests can be safely executed concurrently under G&SR rules.

    Checks user-supplied compatibility rules first with bidirectional matching,
    then consults the built-in Indian Railways G&SR safety matrix.
    """
    id_a = getattr(req_a, "id", None)
    id_b = getattr(req_b, "id", None)
    if id_a is not None and id_b is not None and id_a == id_b:
        return True

    dept_a = _normalize_dept_enum(getattr(req_a, "department", "TRACK")).value
    dept_b = _normalize_dept_enum(getattr(req_b, "department", "TRACK")).value

    act_a = str(getattr(req_a, "activity_type", "") or "").strip()
    act_b = str(getattr(req_b, "activity_type", "") or "").strip()

    # 1. Check explicit user/database compatibility rules
    if compatibility_rules:
        for rule in compatibility_rules:
            r_dept_a = _normalize_dept_enum(getattr(rule, "dept_a", "")).value
            r_dept_b = _normalize_dept_enum(getattr(rule, "dept_b", "")).value
            r_act_a = str(getattr(rule, "activity_a", "") or "").strip()
            r_act_b = str(getattr(rule, "activity_b", "") or "").strip()
            is_compat = bool(getattr(rule, "is_compatible", True))

            if _matches_rule(dept_a, act_a, dept_b, act_b, r_dept_a, r_act_a, r_dept_b, r_act_b, exact_match=True):
                return is_compat

    # 2. Check built-in standard G&SR compatibility rules table
    for r_dept_a, r_act_a, r_dept_b, r_act_b, is_compat, _ in DEFAULT_GSR_RULES:
        if _matches_rule(dept_a, act_a, dept_b, act_b, r_dept_a, r_act_a, r_dept_b, r_act_b, exact_match=False):
            return is_compat

    # 3. Default safe assumption if no specific conflict registered
    return True


def is_cluster_compatible(
    requests: Sequence[Any],
    compatibility_rules: Optional[Sequence[Any]] = None,
) -> bool:
    """Verify that every pair of requests within a candidate cluster is mutually compatible (clique)."""
    if len(requests) <= 1:
        return True

    for i in range(len(requests)):
        for j in range(i + 1, len(requests)):
            if not is_pair_compatible(requests[i], requests[j], compatibility_rules):
                return False

    return True


# ── Spatial & Traction Power Isolation Evaluators ───────────


def are_spatially_compatible(
    req_a: Any,
    req_b: Any,
    max_spatial_km: float = 10.0,
) -> bool:
    """Check whether two requests occur within allowable spatial distance (<= 10 km).

    Requires both requests to belong to the same section, and their chainage distance
    (if recorded in metadata) to not exceed max_spatial_km. Correctly normalizes
    ascending and descending chainages.
    """
    sec_a = getattr(req_a, "section_id", None)
    sec_b = getattr(req_b, "section_id", None)
    if sec_a is not None and sec_b is not None and sec_a != sec_b:
        return False

    s1, e1 = _get_chainage_range(req_a)
    s2, e2 = _get_chainage_range(req_b)

    if s1 is not None and e1 is not None and s2 is not None and e2 is not None:
        # Distance between intervals [s1, e1] and [s2, e2]
        if e1 < s2:
            dist = s2 - e1
        elif e2 < s1:
            dist = s1 - e2
        else:
            dist = 0.0  # Overlapping intervals

        if dist > max_spatial_km:
            return False

    return True


def are_traction_power_compatible(
    req_a: Any,
    req_b: Any,
) -> bool:
    """Verify Feeding Post (FP) / Sectioning Post (SP) power isolation compatibility.

    If both requests require traction power isolation, they must belong to the same
    substation feeding post boundary so electrical switching is coordinated.
    """
    p_iso_a, fp_a = _get_power_isolation_info(req_a)
    p_iso_b, fp_b = _get_power_isolation_info(req_b)

    # If both demand power cut and specified FP/SP boundaries, boundaries must match
    if p_iso_a and p_iso_b and fp_a and fp_b:
        if fp_a != fp_b:
            return False

    return True


def _is_valid_clique(
    combo: Sequence[Any],
    compatibility_rules: Optional[Sequence[Any]] = None,
    max_spatial_km: float = 10.0,
) -> bool:
    """Validate that a combination of requests satisfies spatial, power, and G&SR constraints."""
    k = len(combo)
    for i in range(k):
        for j in range(i + 1, k):
            req_i = combo[i]
            req_j = combo[j]
            if not are_spatially_compatible(req_i, req_j, max_spatial_km=max_spatial_km):
                return False
            if not are_traction_power_compatible(req_i, req_j):
                return False
            if not is_pair_compatible(req_i, req_j, compatibility_rules=compatibility_rules):
                return False
    return True


# ── Core Clustering Engine ───────────────────────────────────


def _build_candidate_shadow_block(
    cluster_requests: Sequence[Any],
    target_date: Optional[date] = None,
    section_code_map: Optional[Dict[UUID, str]] = None,
) -> CandidateShadowBlock:
    """Construct a CandidateShadowBlock with Primary/Shadow offset scheduling."""
    # 1. Identify the Primary Block activity
    # Anchor rule: Highest duration, then highest Criticality Index, then request code
    req_ci_pairs: List[Tuple[Any, float, int]] = []
    for r in cluster_requests:
        ci = compute_criticality_index(r, target_date=target_date)
        dur = int(getattr(r, "duration_minutes", 60))
        req_ci_pairs.append((r, ci, dur))

    sorted_pairs = sorted(
        req_ci_pairs,
        key=lambda item: (item[2], item[1], str(getattr(item[0], "request_code", ""))),
        reverse=True,
    )

    primary_req, primary_ci, primary_duration = sorted_pairs[0]
    sec_id = getattr(primary_req, "section_id", uuid4())
    sec_code = (
        section_code_map.get(sec_id)
        if section_code_map
        else _get_metadata_dict(primary_req).get("section_code")
    )

    primary_dept = _normalize_dept_enum(getattr(primary_req, "department", "TRACK"))
    primary_act_name = str(getattr(primary_req, "activity_type", ""))

    # 2. Schedule internal flexible offsets for activities
    assignments: List[ShadowActivityAssignment] = []
    total_ci = 0.0
    total_durations = 0
    covered_ids: List[UUID] = []
    depts: Set[DepartmentEnum] = set()
    power_iso = False
    feeding_post: Optional[str] = None

    # Add Primary Assignment first
    p_s_km, p_e_km = _get_chainage_range(primary_req)
    p_iso, p_fp = _get_power_isolation_info(primary_req)
    if p_iso:
        power_iso = True
        feeding_post = p_fp

    p_req_id = getattr(primary_req, "id", uuid4())
    covered_ids.append(p_req_id)
    depts.add(primary_dept)
    total_ci += primary_ci
    total_durations += primary_duration

    primary_assignment = ShadowActivityAssignment(
        id=uuid4(),
        maintenance_request_id=p_req_id,
        request_code=str(getattr(primary_req, "request_code", f"MR-{primary_dept.value}-001")),
        department=primary_dept,
        activity_type=primary_act_name,
        duration_minutes=primary_duration,
        start_offset_minutes=0,
        end_offset_minutes=primary_duration,
        criticality_index=primary_ci,
        is_primary=True,
        resource_id=getattr(primary_req, "resource_id", None),
        start_km=p_s_km,
        end_km=p_e_km,
        feeding_post=p_fp,
        power_isolation_required=p_iso,
    )
    assignments.append(primary_assignment)

    # Schedule secondary Shadow Activities
    for r, ci, dur in sorted_pairs[1:]:
        r_dept = _normalize_dept_enum(getattr(r, "department", "TRACK"))
        r_act_name = str(getattr(r, "activity_type", ""))
        r_s_km, r_e_km = _get_chainage_range(r)
        r_iso, r_fp = _get_power_isolation_info(r)
        if r_iso:
            power_iso = True
            if not feeding_post:
                feeding_post = r_fp

        r_id = getattr(r, "id", uuid4())
        covered_ids.append(r_id)
        depts.add(r_dept)
        total_ci += ci
        total_durations += dur

        # Flexible offset scheduling: check preferred offset in metadata or align within [0, primary_duration]
        meta = _get_metadata_dict(r)
        preferred_start = meta.get("start_offset_minutes", meta.get("desired_offset_minutes", 0))
        try:
            start_offset = max(0, min(int(preferred_start), max(0, primary_duration - dur)))
        except (ValueError, TypeError):
            start_offset = 0

        end_offset = min(primary_duration, start_offset + dur)

        assignment = ShadowActivityAssignment(
            id=uuid4(),
            maintenance_request_id=r_id,
            request_code=str(getattr(r, "request_code", f"MR-{r_dept.value}-001")),
            department=r_dept,
            activity_type=r_act_name,
            duration_minutes=dur,
            start_offset_minutes=start_offset,
            end_offset_minutes=end_offset,
            criticality_index=ci,
            is_primary=False,
            resource_id=getattr(r, "resource_id", None),
            start_km=r_s_km,
            end_km=r_e_km,
            feeding_post=r_fp,
            power_isolation_required=r_iso,
        )
        assignments.append(assignment)

    # Overlap hours = labor hours saved via joint concurrency: (sum of all durations - primary duration) / 60.0
    shadow_overlap_hours = round(max(0.0, (total_durations - primary_duration) / 60.0), 2)
    is_joint = len(assignments) > 1

    return CandidateShadowBlock(
        id=uuid4(),
        section_id=sec_id,
        section_code=sec_code,
        primary_request_id=p_req_id,
        primary_department=primary_dept,
        primary_activity=primary_act_name,
        duration_minutes=primary_duration,
        is_joint_shadow_block=is_joint,
        participating_departments=sorted(list(depts), key=lambda d: d.value),
        total_criticality_index=round(total_ci, 2),
        shadow_overlap_hours=shadow_overlap_hours,
        activities=assignments,
        traction_power_isolation=power_iso,
        feeding_post_section=feeding_post,
        requests_covered_ids=covered_ids,
        line_direction="BOTH",
    )


def cluster_shadow_blocks(
    requests: Sequence[Any],
    compatibility_rules: Optional[Sequence[Any]] = None,
    max_spatial_km: float = 10.0,
    target_date: Optional[date] = None,
    section_code_map: Optional[Dict[UUID, str]] = None,
    max_cluster_size: int = 4,
) -> List[CandidateShadowBlock]:
    """Group pending maintenance requests into candidate Joint Shadow Blocks.

    Executes Stage 4 of the RailBlock Optimization Pipeline:
    1. Partitions requests by section.
    2. Generates standalone candidate blocks for each request.
    3. Finds all mutually compatible multi-department groupings satisfying spatial
       distance (<= 10 km), traction power FP/SP boundary isolation, and G&SR safety
       conflict rules.
    4. Anchors the primary possession window by the primary activity and schedules
       flexible internal start/end offsets for secondary shadow activities.
    5. Calculates total aggregated Criticality Index and labor overlap hours saved.

    Args:
        requests: Sequence of pending MaintenanceRequest objects.
        compatibility_rules: Optional sequence of CompatibilityRule domain entities.
        max_spatial_km: Maximum allowable chainage distance between activities (default 10.0 km).
        target_date: Target planning date for deadline and overdue calculations.
        section_code_map: Optional dictionary mapping section UUIDs to section code strings.
        max_cluster_size: Maximum number of maintenance requests to bundle into a single Joint Shadow Block (default 4).

    Returns:
        List of candidate Joint Shadow Blocks sorted by priority and efficiency.
    """
    if not requests:
        return []

    # 1. Partition requests by section_id
    section_requests: Dict[UUID, List[Any]] = {}
    for r in requests:
        status = str(getattr(r, "status", "PENDING")).upper()
        if status in ("COMPLETED", "REJECTED", "CANCELLED"):
            continue
        sec_id = getattr(r, "section_id", None)
        if sec_id is None:
            sec_id = uuid4()
        section_requests.setdefault(sec_id, []).append(r)

    candidate_blocks: List[CandidateShadowBlock] = []

    for sec_id, sec_reqs in section_requests.items():
        n = len(sec_reqs)

        # ── 1. Standalone Solo Candidate Blocks (Every request can run solo) ──
        for r in sec_reqs:
            candidate_blocks.append(
                _build_candidate_shadow_block(
                    cluster_requests=[r],
                    target_date=target_date,
                    section_code_map=section_code_map,
                )
            )

        # ── 2. Multi-Department Joint Grouping (Cliques of size 2 up to max_cluster_size) ──
        max_k = min(n, max_cluster_size)
        for k in range(2, max_k + 1):
            for combo in itertools.combinations(sec_reqs, k):
                if _is_valid_clique(combo, compatibility_rules=compatibility_rules, max_spatial_km=max_spatial_km):
                    candidate_blocks.append(
                        _build_candidate_shadow_block(
                            cluster_requests=combo,
                            target_date=target_date,
                            section_code_map=section_code_map,
                        )
                    )

    # Sort candidate blocks by (total_criticality_index, is_joint_shadow_block, shadow_overlap_hours) descending
    candidate_blocks.sort(
        key=lambda b: (
            b.total_criticality_index,
            b.is_joint_shadow_block,
            b.shadow_overlap_hours,
        ),
        reverse=True,
    )

    return candidate_blocks
