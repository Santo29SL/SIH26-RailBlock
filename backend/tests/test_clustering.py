"""Unit tests for Multi-Department Shadow Block Clustering & G&SR Rules Engine (Stage 4).

Verifies:
1. Criticality Index (CI) calculation (explicit, formula-based with weights, and priority fallback).
2. G&SR safety conflict rule evaluation (pairwise compatibility, symmetry, and explicit rejection).
3. Transitive conflict filtering (subgraph / clique validation).
4. Spatial boundary filtering (<= 10 km spatial clustering).
5. Traction FP/SP power isolation boundary matching.
6. Primary Block duration anchoring and internal flexible Shadow Activity offset scheduling.
7. Multi-department joint bundling (Track + Signal + Traction).
8. Criticality Index aggregation and shadow overlap hours computation.
9. Standalone solo candidate block generation.
10. CandidateShadowBlock dataclass serialization and helper methods.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

import pytest

from app.schemas.common import DepartmentEnum, PriorityEnum
from app.services.clustering import (
    CandidateShadowBlock,
    ShadowActivityAssignment,
    are_spatially_compatible,
    are_traction_power_compatible,
    cluster_shadow_blocks,
    compute_criticality_index,
    is_cluster_compatible,
    is_pair_compatible,
)


# ── Test Fixture Helpers ────────────────────────────────────


@dataclass
class MockMaintenanceRequest:
    """Mock MaintenanceRequest instance for testing."""

    id: uuid.UUID = field(default_factory=uuid.uuid4)
    request_code: str = "MR-TRK-001"
    section_id: uuid.UUID = field(default_factory=uuid.uuid4)
    department: str | DepartmentEnum = "TRACK"
    activity_type: str = "Machine Tamping"
    duration_minutes: int = 120
    priority: str | PriorityEnum = "HIGH"
    deadline: date = field(default_factory=lambda: date(2026, 8, 30))
    status: str = "PENDING"
    resource_id: Optional[uuid.UUID] = None
    metadata_json: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MockCompatibilityRule:
    """Mock CompatibilityRule instance for testing."""

    dept_a: str | DepartmentEnum
    activity_a: str
    dept_b: str | DepartmentEnum
    activity_b: str
    is_compatible: bool
    reason: Optional[str] = None
    id: uuid.UUID = field(default_factory=uuid.uuid4)


def make_standard_rules() -> List[MockCompatibilityRule]:
    """Standard Indian Railways G&SR compatibility rules for unit tests."""
    return [
        MockCompatibilityRule(
            dept_a="TRACK",
            activity_a="Machine Tamping",
            dept_b="SIGNAL",
            activity_b="Point Machine Overhaul",
            is_compatible=False,
            reason="Tamping near points requires signal to be locked",
        ),
        MockCompatibilityRule(
            dept_a="TRACK",
            activity_a="Machine Tamping",
            dept_b="TRACTION",
            activity_b="OHE Wire Adjustment",
            is_compatible=False,
            reason="Safety hazard: OHE work requires power block, tamping requires traffic block",
        ),
        MockCompatibilityRule(
            dept_a="TRACK",
            activity_a="USFD Rail Inspection",
            dept_b="SIGNAL",
            activity_b="Axle Counter Calibration",
            is_compatible=True,
            reason="Both are inspection activities, compatible",
        ),
        MockCompatibilityRule(
            dept_a="TRACK",
            activity_a="USFD Rail Inspection",
            dept_b="TRACTION",
            activity_b="Pantograph Clearance Check",
            is_compatible=True,
            reason="Inspection activities on separate assets",
        ),
        MockCompatibilityRule(
            dept_a="SIGNAL",
            activity_a="Axle Counter Calibration",
            dept_b="TRACTION",
            activity_b="Pantograph Clearance Check",
            is_compatible=True,
            reason="Compatible cross-department inspections",
        ),
        MockCompatibilityRule(
            dept_a="SIGNAL",
            activity_a="Point Machine Overhaul",
            dept_b="TRACTION",
            activity_b="OHE Wire Adjustment",
            is_compatible=True,
            reason="Different systems, can work in parallel with coordination",
        ),
        MockCompatibilityRule(
            dept_a="TRACK",
            activity_a="Rail Destressing (LWR/CWR)",
            dept_b="TRACTION",
            activity_b="OHE Wire Adjustment",
            is_compatible=False,
            reason="Full block collision risk",
        ),
    ]


# ── 1. Criticality Index Calculation Tests ───────────────────


def test_compute_criticality_index_explicit():
    """If metadata_json explicitly provides criticality_index, use it directly."""
    req = MockMaintenanceRequest(
        metadata_json={"criticality_index": 88.5}
    )
    ci = compute_criticality_index(req)
    assert ci == pytest.approx(88.5)


def test_compute_criticality_index_formula():
    """Calculate CI using weighted formula when raw metrics are present in metadata."""
    # Target date: 2026-08-25, Deadline: 2026-08-20 (5 days overdue)
    # Weights in settings: TGI=0.35, TSR=0.25, Overdue=0.20, GMT=0.20
    req = MockMaintenanceRequest(
        deadline=date(2026, 8, 20),
        metadata_json={
            "tgi_deviation": 80.0,  # 80 * 0.35 = 28.0
            "speed_restriction_delta": 60.0,  # 60 * 0.25 = 15.0
            "days_overdue": 5,  # min(100, 5*10) = 50 * 0.20 = 10.0
            "section_gmt_density": 70.0,  # 70 * 0.20 = 14.0
        },
    )
    ci = compute_criticality_index(req, target_date=date(2026, 8, 25))
    expected = 28.0 + 15.0 + 10.0 + 14.0  # 67.0
    assert ci == pytest.approx(expected)


def test_compute_criticality_index_priority_fallback():
    """When no raw metrics are present, fall back to priority-based baseline."""
    crit_req = MockMaintenanceRequest(priority=PriorityEnum.CRITICAL)
    high_req = MockMaintenanceRequest(priority=PriorityEnum.HIGH)
    med_req = MockMaintenanceRequest(priority=PriorityEnum.MEDIUM)
    low_req = MockMaintenanceRequest(priority=PriorityEnum.LOW)

    assert compute_criticality_index(crit_req) == pytest.approx(90.0)
    assert compute_criticality_index(high_req) == pytest.approx(75.0)
    assert compute_criticality_index(med_req) == pytest.approx(50.0)
    assert compute_criticality_index(low_req) == pytest.approx(25.0)


# ── 2. G&SR Safety Rules & Pairwise Compatibility Tests ──────


def test_is_pair_compatible_rules():
    """Verify bidirectional rule matching and explicit conflict detection."""
    rules = make_standard_rules()

    req_tamp = MockMaintenanceRequest(
        department="TRACK", activity_type="Machine Tamping"
    )
    req_point = MockMaintenanceRequest(
        department="SIGNAL", activity_type="Point Machine Overhaul"
    )
    req_usfd = MockMaintenanceRequest(
        department="TRACK", activity_type="USFD Rail Inspection"
    )
    req_axle = MockMaintenanceRequest(
        department="SIGNAL", activity_type="Axle Counter Calibration"
    )

    # Incompatible: Track Tamping + Signal Point Overhaul
    assert is_pair_compatible(req_tamp, req_point, rules) is False
    assert is_pair_compatible(req_point, req_tamp, rules) is False

    # Compatible: Track USFD + Signal Axle Counter
    assert is_pair_compatible(req_usfd, req_axle, rules) is True
    assert is_pair_compatible(req_axle, req_usfd, rules) is True


def test_is_cluster_compatible_clique():
    """Verify is_cluster_compatible enforces all pairs in a group must be mutually compatible."""
    rules = make_standard_rules()

    # Pairwise compatible trio: USFD (Track) + Axle (Signal) + Panto (Traction)
    req_track = MockMaintenanceRequest(
        department="TRACK", activity_type="USFD Rail Inspection"
    )
    req_sig = MockMaintenanceRequest(
        department="SIGNAL", activity_type="Axle Counter Calibration"
    )
    req_trc = MockMaintenanceRequest(
        department="TRACTION", activity_type="Pantograph Clearance Check"
    )

    assert is_cluster_compatible([req_track, req_sig, req_trc], rules) is True

    # Incompatible trio: Tamping (Track) + Point (Signal) + OHE (Traction)
    # Tamping conflicts with Point and OHE
    req_tamp = MockMaintenanceRequest(
        department="TRACK", activity_type="Machine Tamping"
    )
    req_point = MockMaintenanceRequest(
        department="SIGNAL", activity_type="Point Machine Overhaul"
    )
    req_ohe = MockMaintenanceRequest(
        department="TRACTION", activity_type="OHE Wire Adjustment"
    )

    assert is_cluster_compatible([req_tamp, req_point, req_ohe], rules) is False


def test_transitive_incompatibility_rejection():
    """If A is compatible with B, B with C, but A incompatible with C, ABC cannot form a candidate block."""
    rules = [
        MockCompatibilityRule("TRACK", "Activity A", "SIGNAL", "Activity B", True),
        MockCompatibilityRule("SIGNAL", "Activity B", "TRACTION", "Activity C", True),
        MockCompatibilityRule("TRACK", "Activity A", "TRACTION", "Activity C", False),
    ]

    req_a = MockMaintenanceRequest(department="TRACK", activity_type="Activity A")
    req_b = MockMaintenanceRequest(department="SIGNAL", activity_type="Activity B")
    req_c = MockMaintenanceRequest(department="TRACTION", activity_type="Activity C")

    assert is_cluster_compatible([req_a, req_b], rules) is True
    assert is_cluster_compatible([req_b, req_c], rules) is True
    assert is_cluster_compatible([req_a, req_c], rules) is False
    assert is_cluster_compatible([req_a, req_b, req_c], rules) is False


# ── 3. Spatial Boundary & Chainage Filtering Tests ───────────


def test_spatial_compatibility_chainage():
    """Requests on the same section must be within max_spatial_km (default 10 km)."""
    sec_id = uuid.uuid4()

    # Close requests: KM 142.0 to 145.0 and KM 146.0 to 148.0 (distance 1.0 km <= 10 km)
    req1 = MockMaintenanceRequest(
        section_id=sec_id,
        metadata_json={"start_km": 142.0, "end_km": 145.0},
    )
    req2 = MockMaintenanceRequest(
        section_id=sec_id,
        metadata_json={"start_km": 146.0, "end_km": 148.0},
    )
    assert are_spatially_compatible(req1, req2, max_spatial_km=10.0) is True

    # Distant requests: KM 142.0 to 145.0 and KM 160.0 to 162.0 (distance 15.0 km > 10 km)
    req3 = MockMaintenanceRequest(
        section_id=sec_id,
        metadata_json={"start_km": 160.0, "end_km": 162.0},
    )
    assert are_spatially_compatible(req1, req3, max_spatial_km=10.0) is False

    # Different sections are not spatially compatible
    sec_other = uuid.uuid4()
    req_other_sec = MockMaintenanceRequest(
        section_id=sec_other,
        metadata_json={"start_km": 142.0, "end_km": 145.0},
    )
    assert are_spatially_compatible(req1, req_other_sec) is False


# ── 4. Traction Power Isolation Boundary Matching Tests ──────


def test_traction_power_isolation_matching():
    """Traction requests requiring power isolation must share compatible Feeding Posts (FP)."""
    sec_id = uuid.uuid4()

    # Request 1: TRD task requiring FP-KOK-SP-TRL isolation
    req1 = MockMaintenanceRequest(
        section_id=sec_id,
        department="TRACTION",
        activity_type="OHE Wire Adjustment",
        metadata_json={
            "power_isolation_required": True,
            "feeding_post": "FP-KOK-SP-TRL",
        },
    )

    # Request 2: TRD task in same power isolation zone
    req2 = MockMaintenanceRequest(
        section_id=sec_id,
        department="TRACTION",
        activity_type="Insulator Cleaning/Replacement",
        metadata_json={
            "power_isolation_required": True,
            "feeding_post": "FP-KOK-SP-TRL",
        },
    )

    # Request 3: TRD task in a different power isolation zone
    req3 = MockMaintenanceRequest(
        section_id=sec_id,
        department="TRACTION",
        activity_type="Feeder Line Maintenance",
        metadata_json={
            "power_isolation_required": True,
            "feeding_post": "FP-AJJ-SP-TRT",
        },
    )

    # Same FP/SP isolation zone is compatible
    assert are_traction_power_compatible(req1, req2) is True
    # Different FP/SP isolation zones are incompatible
    assert are_traction_power_compatible(req1, req3) is False


# ── 5. Full Shadow Block Clustering Engine Tests ─────────────


def test_cluster_shadow_blocks_3_department_bundling():
    """3 compatible requests from Track, Signal, and Traction bundle into a 3-way Joint Shadow Block."""
    sec_id = uuid.uuid4()
    rules = make_standard_rules()

    # Track: USFD Inspection (90 mins, CI 75)
    r_track = MockMaintenanceRequest(
        id=uuid.uuid4(),
        request_code="MR-TRK-001",
        section_id=sec_id,
        department=DepartmentEnum.TRACK,
        activity_type="USFD Rail Inspection",
        duration_minutes=90,
        priority=PriorityEnum.HIGH,
        metadata_json={"start_km": 142.0, "end_km": 145.0},
    )

    # Signal: Axle Counter Calibration (60 mins, CI 50)
    r_sig = MockMaintenanceRequest(
        id=uuid.uuid4(),
        request_code="MR-SIG-001",
        section_id=sec_id,
        department=DepartmentEnum.SIGNAL,
        activity_type="Axle Counter Calibration",
        duration_minutes=60,
        priority=PriorityEnum.MEDIUM,
        metadata_json={"start_km": 143.0, "end_km": 144.0},
    )

    # Traction: Pantograph Clearance Check (45 mins, CI 25)
    r_trc = MockMaintenanceRequest(
        id=uuid.uuid4(),
        request_code="MR-TRC-001",
        section_id=sec_id,
        department=DepartmentEnum.TRACTION,
        activity_type="Pantograph Clearance Check",
        duration_minutes=45,
        priority=PriorityEnum.LOW,
        metadata_json={
            "start_km": 142.5,
            "end_km": 143.5,
            "power_isolation_required": True,
            "feeding_post": "FP-KOK-SP-TRL",
        },
    )

    candidates = cluster_shadow_blocks(
        requests=[r_track, r_sig, r_trc],
        compatibility_rules=rules,
        max_spatial_km=10.0,
    )

    # Should generate:
    # 3 standalone solo candidate blocks
    # 3 2-way joint candidate blocks (Track+Signal, Track+Traction, Signal+Traction)
    # 1 3-way joint candidate block (Track+Signal+Traction)
    assert len(candidates) >= 7

    # Find the 3-department joint block
    joint_3way = next(
        (c for c in candidates if len(c.participating_departments) == 3),
        None,
    )
    assert joint_3way is not None
    assert joint_3way.is_joint_shadow_block is True
    assert joint_3way.duration_minutes == 90  # Governed by primary (Track USFD 90m)
    assert joint_3way.primary_department == DepartmentEnum.TRACK
    assert joint_3way.primary_activity == "USFD Rail Inspection"
    assert joint_3way.total_criticality_index == pytest.approx(75.0 + 50.0 + 25.0)  # 150.0
    # Overlap hours = (90 + 60 + 45 - 90) / 60 = 105 / 60 = 1.75 hours
    assert joint_3way.shadow_overlap_hours == pytest.approx(1.75)
    assert joint_3way.traction_power_isolation is True
    assert joint_3way.feeding_post_section == "FP-KOK-SP-TRL"

    # Verify activities inside the joint block
    assert len(joint_3way.activities) == 3
    primary_act = next(a for a in joint_3way.activities if a.is_primary)
    assert primary_act.request_code == "MR-TRK-001"
    assert primary_act.start_offset_minutes == 0
    assert primary_act.end_offset_minutes == 90

    # Secondary shadow activities must have valid internal offsets
    shadow_acts = [a for a in joint_3way.activities if not a.is_primary]
    assert len(shadow_acts) == 2
    for s_act in shadow_acts:
        assert 0 <= s_act.start_offset_minutes <= s_act.end_offset_minutes <= joint_3way.duration_minutes
        assert (s_act.end_offset_minutes - s_act.start_offset_minutes) == s_act.duration_minutes


def test_cluster_shadow_blocks_rejects_incompatible_pair():
    """Incompatible activities (Track Tamping + Signal Point Overhaul) are never bundled."""
    sec_id = uuid.uuid4()
    rules = make_standard_rules()

    r_tamp = MockMaintenanceRequest(
        id=uuid.uuid4(),
        request_code="MR-TRK-002",
        section_id=sec_id,
        department=DepartmentEnum.TRACK,
        activity_type="Machine Tamping",
        duration_minutes=180,
    )
    r_point = MockMaintenanceRequest(
        id=uuid.uuid4(),
        request_code="MR-SIG-002",
        section_id=sec_id,
        department=DepartmentEnum.SIGNAL,
        activity_type="Point Machine Overhaul",
        duration_minutes=120,
    )

    candidates = cluster_shadow_blocks(
        requests=[r_tamp, r_point],
        compatibility_rules=rules,
    )

    # Should only produce 2 solo candidate blocks, NO joint block
    assert len(candidates) == 2
    assert all(not c.is_joint_shadow_block for c in candidates)
    assert all(len(c.activities) == 1 for c in candidates)


def test_cluster_shadow_blocks_spatial_rejection():
    """Compatible activities on the same section but > 10 km apart are NOT bundled."""
    sec_id = uuid.uuid4()
    rules = make_standard_rules()

    r1 = MockMaintenanceRequest(
        id=uuid.uuid4(),
        request_code="MR-TRK-003",
        section_id=sec_id,
        department=DepartmentEnum.TRACK,
        activity_type="USFD Rail Inspection",
        duration_minutes=60,
        metadata_json={"start_km": 10.0, "end_km": 12.0},
    )
    r2 = MockMaintenanceRequest(
        id=uuid.uuid4(),
        request_code="MR-SIG-003",
        section_id=sec_id,
        department=DepartmentEnum.SIGNAL,
        activity_type="Axle Counter Calibration",
        duration_minutes=60,
        metadata_json={"start_km": 35.0, "end_km": 36.0},  # 23 km away
    )

    candidates = cluster_shadow_blocks(
        requests=[r1, r2],
        compatibility_rules=rules,
        max_spatial_km=10.0,
    )

    # No joint block allowed due to > 10 km separation
    assert len(candidates) == 2
    assert all(not c.is_joint_shadow_block for c in candidates)


def test_candidate_shadow_block_dataclass_methods():
    """Test CandidateShadowBlock to_dict(), helper properties, and Department enum handling."""
    sec_id = uuid.uuid4()
    req_id = uuid.uuid4()

    act = ShadowActivityAssignment(
        maintenance_request_id=req_id,
        request_code="MR-TRK-001",
        department=DepartmentEnum.TRACK,
        activity_type="Machine Tamping",
        duration_minutes=120,
        start_offset_minutes=0,
        end_offset_minutes=120,
        criticality_index=85.0,
        is_primary=True,
    )

    block = CandidateShadowBlock(
        id=uuid.uuid4(),
        section_id=sec_id,
        section_code="MAS-AJJ",
        primary_request_id=req_id,
        primary_department=DepartmentEnum.TRACK,
        primary_activity="Machine Tamping",
        duration_minutes=120,
        is_joint_shadow_block=False,
        participating_departments=[DepartmentEnum.TRACK],
        total_criticality_index=85.0,
        shadow_overlap_hours=0.0,
        activities=[act],
        traction_power_isolation=False,
        feeding_post_section=None,
        requests_covered_ids=[req_id],
        line_direction="UP",
    )

    assert block.has_department("TRACK") is True
    assert block.has_department(DepartmentEnum.TRACK) is True
    assert block.has_department("SIGNAL") is False

    d = block.to_dict()
    assert d["primary_activity"] == "Machine Tamping"
    assert d["duration_minutes"] == 120
    assert d["total_criticality_index"] == 85.0
    assert len(d["activities"]) == 1
    assert d["activities"][0]["request_code"] == "MR-TRK-001"
