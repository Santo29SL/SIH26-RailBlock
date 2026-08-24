"""Google OR-Tools Space-Time Constraint Optimization Engine.

Stage 5 Algorithmic Core for RailBlock (SIH PS 26027).

Assigns candidate Joint Shadow Blocks into available Corridor Gaps over rolling
planning horizons using Google OR-Tools CP-SAT Mixed-Integer Linear Programming (MILP),
enforcing Tier 1 (Rajdhani/Vande Bharat) zero-detention hard constraints and heavy machine
resource capacity limits across sections while maximizing multi-objective score:
    max sum( y_{m,g} * [ Criticality(m) + alpha * ShadowHours(m) - beta * DetentionMinutes(m,g) ] )

Canonical domain terminology strictly follows CONTEXT.md:
- Section: Physical track segment between two consecutive block stations.
- Feeding Post (FP) / Sectioning Post (SP): Substation traction switching installation defining electrical isolation boundaries.
- Corridor Gap: Continuous unoccupied track interval.
- Safety Buffer: Statutory minimum time headway enforced before and after train passage (>= 15 mins).
- Joint Shadow Block: Consolidated block executing compatible maintenance requests concurrently.
- Primary Block: The anchor maintenance activity governing the corridor window.
- Shadow Activity: Secondary compatible maintenance task performed concurrently.
- Criticality Index (CI): Normalized score (0-100) representing defect urgency, safety hazard, and operational risk.
- G&SR (General and Subsidiary Rules): Indian Railways statutory operating rulebook.
"""

from __future__ import annotations

import time as _time
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple
from uuid import UUID, uuid4

from ortools.sat.python import cp_model

from app.core.config import settings
from app.schemas.common import BlockStatusEnum, DepartmentEnum, LineTypeEnum
from app.services.clustering import (
    CandidateShadowBlock,
    ShadowActivityAssignment,
    cluster_shadow_blocks,
)
from app.services.gap_extractor import CorridorGap, extract_corridor_gaps


# ── Domain Data Structures (Frozen Dataclasses) ─────────────


@dataclass(frozen=True)
class ScheduledBlock:
    """A scheduled maintenance block assigned to an unoccupied corridor gap.

    Canonical domain term: Block / Joint Shadow Block (see CONTEXT.md).
    Represents an optimized track possession allocated on a section.
    """

    id: UUID
    candidate_block_id: UUID
    corridor_gap_id: UUID
    section_id: UUID
    section_code: Optional[str]
    block_date: date
    start_time: time
    end_time: time
    start_datetime: datetime
    end_datetime: datetime
    duration_minutes: int
    is_joint_shadow_block: bool
    primary_department: DepartmentEnum
    participating_departments: List[DepartmentEnum]
    total_criticality_index: float
    shadow_overlap_hours: float
    estimated_train_detention_minutes: int
    activities: List[ShadowActivityAssignment]
    requests_covered_ids: List[UUID]
    line_direction: str = "BOTH"
    traction_power_isolation: bool = False
    feeding_post_section: Optional[str] = None
    status: BlockStatusEnum = BlockStatusEnum.PROPOSED
    block_code: Optional[str] = None
    optimizer_metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert ScheduledBlock to standard dictionary representation."""
        prim_dept = (
            self.primary_department.value
            if hasattr(self.primary_department, "value")
            else str(self.primary_department)
        )
        parts = [
            (d.value if hasattr(d, "value") else str(d))
            for d in self.participating_departments
        ]
        status_str = (
            self.status.value if hasattr(self.status, "value") else str(self.status)
        )
        return {
            "id": str(self.id),
            "block_code": self.block_code or f"BLK-{self.block_date.strftime('%Y%m%d')}-{str(self.id)[:6].upper()}",
            "candidate_block_id": str(self.candidate_block_id),
            "corridor_gap_id": str(self.corridor_gap_id),
            "section_id": str(self.section_id),
            "section_code": self.section_code,
            "block_date": self.block_date.isoformat(),
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "start_datetime": self.start_datetime.isoformat(),
            "end_datetime": self.end_datetime.isoformat(),
            "duration_minutes": self.duration_minutes,
            "is_joint_shadow_block": self.is_joint_shadow_block,
            "primary_department": prim_dept,
            "participating_departments": parts,
            "total_criticality_index": round(self.total_criticality_index, 2),
            "shadow_overlap_hours": round(self.shadow_overlap_hours, 2),
            "estimated_train_detention_minutes": self.estimated_train_detention_minutes,
            "status": status_str,
            "line_direction": self.line_direction,
            "traction_power_isolation": self.traction_power_isolation,
            "feeding_post_section": self.feeding_post_section,
            "requests_covered_ids": [str(rid) for rid in self.requests_covered_ids],
            "activities": [a.to_dict() for a in self.activities],
            "optimizer_metadata": self.optimizer_metadata,
        }


@dataclass(frozen=True)
class OptimizationResult:
    """Complete results generated by the Google OR-Tools optimization engine."""

    run_id: UUID
    target_date: date
    solver_status: str  # "OPTIMAL", "FEASIBLE", "INFEASIBLE", "TIMEOUT", "NO_SOLUTION"
    is_optimal: bool
    is_feasible: bool
    total_blocks_scheduled: int
    total_maintenance_requests_covered: int
    total_unassigned_requests: int
    total_shadow_overlap_hours: float
    total_train_detention_minutes: int
    total_criticality_index: float
    objective_value: Optional[float]
    solver_execution_time_ms: float
    scheduled_blocks: List[ScheduledBlock]
    unassigned_request_ids: List[UUID]
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert OptimizationResult to standard dictionary representation."""
        return {
            "run_id": str(self.run_id),
            "target_date": self.target_date.isoformat(),
            "solver_status": self.solver_status,
            "is_optimal": self.is_optimal,
            "is_feasible": self.is_feasible,
            "total_blocks_scheduled": self.total_blocks_scheduled,
            "total_maintenance_requests_covered": self.total_maintenance_requests_covered,
            "total_unassigned_requests": self.total_unassigned_requests,
            "total_shadow_overlap_hours": round(self.total_shadow_overlap_hours, 2),
            "total_train_detention_minutes": self.total_train_detention_minutes,
            "total_criticality_index": round(self.total_criticality_index, 2),
            "objective_value": round(self.objective_value, 4) if self.objective_value is not None else None,
            "solver_execution_time_ms": round(self.solver_execution_time_ms, 2),
            "scheduled_blocks": [b.to_dict() for b in self.scheduled_blocks],
            "unassigned_request_ids": [str(rid) for rid in self.unassigned_request_ids],
            "metadata": self.metadata,
        }


# ── Helper Functions for Candidate-Gap Filtering ────────────


def _is_direction_compatible(candidate_dir: str, gap_dir: str) -> bool:
    """Check if candidate block direction matches corridor gap line direction."""
    c_dir = (candidate_dir or "BOTH").upper()
    g_dir = (gap_dir or "BOTH").upper()

    if c_dir in ("BOTH", "SINGLE") or g_dir in ("BOTH", "SINGLE"):
        return True
    return c_dir == g_dir


def _extract_block_resource_ids(block: CandidateShadowBlock) -> Set[UUID]:
    """Extract all resource UUIDs required by activities in a candidate block."""
    return block.resource_ids


def _build_empty_result(
    run_id: UUID,
    effective_date: date,
    solver_status: str,
    is_optimal: bool,
    is_feasible: bool,
    known_request_ids: Set[UUID],
    t_elapsed_ms: float,
    message: str,
) -> OptimizationResult:
    """Helper to construct an empty OptimizationResult fallback."""
    return OptimizationResult(
        run_id=run_id,
        target_date=effective_date,
        solver_status=solver_status,
        is_optimal=is_optimal,
        is_feasible=is_feasible,
        total_blocks_scheduled=0,
        total_maintenance_requests_covered=0,
        total_unassigned_requests=len(known_request_ids),
        total_shadow_overlap_hours=0.0,
        total_train_detention_minutes=0,
        total_criticality_index=0.0,
        objective_value=0.0,
        solver_execution_time_ms=t_elapsed_ms,
        scheduled_blocks=[],
        unassigned_request_ids=sorted(list(known_request_ids), key=str),
        metadata={"message": message},
    )


def _calculate_estimated_detention(
    candidate: CandidateShadowBlock,
    gap: CorridorGap,
) -> int:
    """Calculate estimated train detention minutes for assigning candidate to gap.

    Standard corridor gaps enforce full safety buffers on both sides and duration
    fits within the gap, resulting in 0 detention.
    If the gap is bordered by VIP trains (Rajdhani, Vande Bharat), detention is 0
    under Tier 1 zero-detention hard constraint.
    """
    if candidate.duration_minutes <= gap.duration_minutes:
        return 0

    # Overrunning gap duration causes detention to following train
    overrun = candidate.duration_minutes - gap.duration_minutes
    return overrun


# ── Google OR-Tools Constraint Optimization Solver ──────────


def solve_block_schedule(
    gaps: Sequence[CorridorGap],
    candidate_blocks: Sequence[CandidateShadowBlock],
    resources: Optional[Sequence[Any]] = None,
    alpha_shadow: Optional[float] = None,
    beta_detention: Optional[float] = None,
    max_solver_time_seconds: Optional[int] = None,
    target_date: Optional[date] = None,
    all_request_ids: Optional[Sequence[UUID]] = None,
) -> OptimizationResult:
    """Solve the Mixed-Integer Linear Programming (MILP / CP-SAT) block assignment problem.

    Assigns candidate Joint Shadow Blocks into available Corridor Gaps over rolling
    planning horizons, enforcing:
    1. Section match: block m can only be assigned to gap g on the same physical section.
    2. Duration limit: block duration cannot exceed gap duration.
    3. Non-overlapping gap occupancy: at most one block per section per corridor gap window.
    4. Request uniqueness: each maintenance request is assigned at most once across all chosen blocks.
    5. Tier 1 VIP Timetable Protection: zero detention permitted for Rajdhani / Vande Bharat trains.
    6. Resource Capacity Limits: heavy machine & equipment capacities are strictly enforced across sections.
    7. Multi-objective maximization:
       max sum( y_{m,g} * [ Criticality(m) + alpha * ShadowHours(m) - beta * DetentionMinutes(m,g) ] )

    Args:
        gaps: Sequence of extracted CorridorGap dataclasses.
        candidate_blocks: Sequence of candidate single and Joint Shadow Blocks.
        resources: Optional sequence of Resource objects with id and capacity attributes.
        alpha_shadow: Solver weight for shadow overlap hours (default from settings: 1.5).
        beta_detention: Solver penalty weight for train detention minutes (default from settings: 0.8).
        max_solver_time_seconds: Maximum solver execution time in seconds (default from settings: 30s).
        target_date: Target planning calendar date.
        all_request_ids: Optional collection of all submitted maintenance request IDs to track unassigned.

    Returns:
        OptimizationResult frozen dataclass with scheduled blocks and KPI metrics.
    """
    t_start = _time.perf_counter()
    run_id = uuid4()

    # Resolve default weights and timeout settings
    alpha = alpha_shadow if alpha_shadow is not None else settings.SOLVER_ALPHA_SHADOW_WEIGHT
    beta = beta_detention if beta_detention is not None else settings.SOLVER_BETA_DETENTION_WEIGHT
    timeout_sec = max_solver_time_seconds if max_solver_time_seconds is not None else settings.SOLVER_TIMEOUT_SECONDS

    # Determine effective target date
    effective_date = target_date
    if effective_date is None and gaps:
        effective_date = gaps[0].target_date
    elif effective_date is None:
        effective_date = date.today()

    # Collect all unique request IDs across inputs
    known_request_ids: Set[UUID] = set(all_request_ids or [])
    for cb in candidate_blocks:
        known_request_ids.update(cb.requests_covered_ids)

    # ── Edge Case: No Gaps or No Candidate Blocks ────────────
    if not gaps or not candidate_blocks:
        t_elapsed_ms = (_time.perf_counter() - t_start) * 1000.0
        return _build_empty_result(
            run_id=run_id,
            effective_date=effective_date,
            solver_status="OPTIMAL" if not candidate_blocks else "NO_SOLUTION",
            is_optimal=not bool(candidate_blocks),
            is_feasible=True,
            known_request_ids=known_request_ids,
            t_elapsed_ms=t_elapsed_ms,
            message="No available gaps or candidate blocks provided.",
        )

    # ── 1. Initialize CP-SAT Model ────────────────────────────
    model = cp_model.CpModel()

    # ── 2. Identify Valid Candidate-Gap Pairs & Decision Variables ──────────
    # y[m_idx, g_idx] = 1 if candidate block m is scheduled in corridor gap g
    pair_vars: Dict[Tuple[int, int], cp_model.IntVar] = {}
    valid_pairs_for_block: Dict[int, List[int]] = {m_idx: [] for m_idx in range(len(candidate_blocks))}
    valid_pairs_for_gap: Dict[int, List[int]] = {g_idx: [] for g_idx in range(len(gaps))}
    score_for_pair: Dict[Tuple[int, int], int] = {}
    detention_for_pair: Dict[Tuple[int, int], int] = {}

    for m_idx, block in enumerate(candidate_blocks):
        for g_idx, gap in enumerate(gaps):
            # Hard Constraint 1: Section Match
            if block.section_id != gap.section_id:
                continue

            # Hard Constraint 2: Duration Limit (Block must fit within gap duration)
            if block.duration_minutes > gap.duration_minutes:
                continue

            # Hard Constraint 3: Directional Line Compatibility
            if not _is_direction_compatible(block.line_direction, gap.line_direction):
                continue

            # Hard Constraint 4: Tier 1 VIP Train Timetable Protection (ADR 0003)
            # If gap borders a VIP train and the block duration would encroach beyond gap,
            # or if zero-detention hard constraint would be violated, reject assignment.
            detention_mins = _calculate_estimated_detention(block, gap)
            if gap.has_vip_train_proximity and detention_mins > 0:
                continue

            # Create Boolean Decision Variable y_{m, g}
            var_name = f"y_m{m_idx}_g{g_idx}"
            y_var = model.NewBoolVar(var_name)
            pair_vars[(m_idx, g_idx)] = y_var
            valid_pairs_for_block[m_idx].append(g_idx)
            valid_pairs_for_gap[g_idx].append(m_idx)
            detention_for_pair[(m_idx, g_idx)] = detention_mins

            # Multi-objective score computation:
            # Score = Criticality(m) + alpha * ShadowHours(m) - beta * DetentionMinutes(m, g)
            # Scaled by 1000 for exact CP-SAT integer optimization
            raw_score = (
                block.total_criticality_index
                + (alpha * block.shadow_overlap_hours)
                - (beta * detention_mins)
            )
            # Guarantee non-negative integer representation for CP-SAT
            scaled_score = int(round(raw_score * 1000))
            score_for_pair[(m_idx, g_idx)] = scaled_score

    # If no valid pairs can be formed due to duration/section mismatches
    if not pair_vars:
        t_elapsed_ms = (_time.perf_counter() - t_start) * 1000.0
        return _build_empty_result(
            run_id=run_id,
            effective_date=effective_date,
            solver_status="NO_SOLUTION",
            is_optimal=False,
            is_feasible=False,
            known_request_ids=known_request_ids,
            t_elapsed_ms=t_elapsed_ms,
            message="No candidate blocks fit into the available corridor gaps.",
        )

    # ── 3. Add Hard Constraints ───────────────────────────────

    # Constraint A: At most one candidate block per corridor gap
    for g_idx, m_indices in valid_pairs_for_gap.items():
        if m_indices:
            model.Add(sum(pair_vars[(m_idx, g_idx)] for m_idx in m_indices) <= 1)

    # Constraint B: Section & Track Exclusivity for Overlapping Gaps
    # If two corridor gaps g1, g2 on the same section overlap in calendar time and share track direction,
    # at most one can have a block assigned.
    for g1_idx in range(len(gaps)):
        for g2_idx in range(g1_idx + 1, len(gaps)):
            gap1 = gaps[g1_idx]
            gap2 = gaps[g2_idx]

            if gap1.section_id == gap2.section_id and _is_direction_compatible(gap1.line_direction, gap2.line_direction):
                # Check space-time overlap
                if gap1.start_datetime < gap2.end_datetime and gap2.start_datetime < gap1.end_datetime:
                    vars_g1 = [pair_vars[(m_idx, g1_idx)] for m_idx in valid_pairs_for_gap[g1_idx]]
                    vars_g2 = [pair_vars[(m_idx, g2_idx)] for m_idx in valid_pairs_for_gap[g2_idx]]
                    if vars_g1 and vars_g2:
                        model.Add(sum(vars_g1) + sum(vars_g2) <= 1)

    # Constraint C: Maintenance Request Uniqueness
    # Each maintenance request R can appear in at most one scheduled block across all gaps!
    # (Prevents double-booking requests present in both solo and joint candidate blocks)
    req_to_pairs: Dict[UUID, List[Tuple[int, int]]] = {}
    for (m_idx, g_idx) in pair_vars.keys():
        block = candidate_blocks[m_idx]
        for req_id in block.requests_covered_ids:
            req_to_pairs.setdefault(req_id, []).append((m_idx, g_idx))

    for req_id, pairs in req_to_pairs.items():
        model.Add(sum(pair_vars[p] for p in pairs) <= 1)

    # Constraint D: Machine / Equipment Resource Capacities Across Sections
    # If shared maintenance resources (e.g. Tamping Machine #1, OHE Tower Wagon #2) have capacity C,
    # the number of concurrent blocks utilizing that resource across all sections cannot exceed C.
    if resources:
        # Build resource lookup map: id -> capacity
        resource_capacity_map: Dict[UUID, int] = {}
        for r in resources:
            r_id = getattr(r, "id", None)
            if r_id is not None:
                cap = int(getattr(r, "capacity", 1) or 1)
                is_avail = bool(getattr(r, "is_available", True))
                resource_capacity_map[r_id] = cap if is_avail else 0

        # Map each resource to active assignment intervals
        for res_id, capacity in resource_capacity_map.items():
            # Find all (m, g) pairs requiring this resource
            res_pairs: List[Tuple[int, int]] = []
            for (m_idx, g_idx) in pair_vars.keys():
                block = candidate_blocks[m_idx]
                if res_id in _extract_block_resource_ids(block):
                    res_pairs.append((m_idx, g_idx))

            if not res_pairs:
                continue

            if capacity == 0:
                # Resource is marked unavailable: strictly disallow any block requiring it
                for p in res_pairs:
                    model.Add(pair_vars[p] == 0)
                continue

            # For capacity >= 1, pairwise overlap constraint or interval variables
            # For each pair of assignments requiring the same resource that overlap in time
            for i in range(len(res_pairs)):
                m1_idx, g1_idx = res_pairs[i]
                gap1 = gaps[g1_idx]
                block1 = candidate_blocks[m1_idx]
                b1_end = gap1.start_datetime + timedelta(minutes=block1.duration_minutes)

                for j in range(i + 1, len(res_pairs)):
                    m2_idx, g2_idx = res_pairs[j]
                    gap2 = gaps[g2_idx]
                    block2 = candidate_blocks[m2_idx]
                    b2_end = gap2.start_datetime + timedelta(minutes=block2.duration_minutes)

                    # Check temporal overlap
                    if gap1.start_datetime < b2_end and gap2.start_datetime < b1_end:
                        if capacity == 1:
                            model.Add(pair_vars[(m1_idx, g1_idx)] + pair_vars[(m2_idx, g2_idx)] <= 1)

            # For general capacity > 1, enforce cumulative capacity over time points
            if capacity > 1:
                # Find all distinct start/end transition points
                time_points: Set[datetime] = set()
                for (m_idx, g_idx) in res_pairs:
                    gap = gaps[g_idx]
                    dur = candidate_blocks[m_idx].duration_minutes
                    time_points.add(gap.start_datetime)
                    time_points.add(gap.start_datetime + timedelta(minutes=dur))

                for t_point in time_points:
                    overlapping_vars = []
                    for (m_idx, g_idx) in res_pairs:
                        gap = gaps[g_idx]
                        dur = candidate_blocks[m_idx].duration_minutes
                        b_start = gap.start_datetime
                        b_end = b_start + timedelta(minutes=dur)
                        if b_start <= t_point < b_end:
                            overlapping_vars.append(pair_vars[(m_idx, g_idx)])
                    if overlapping_vars:
                        model.Add(sum(overlapping_vars) <= capacity)

    # ── 4. Set Multi-Objective Maximization ────────────────────
    objective_expr = sum(
        score_for_pair[pair] * var
        for pair, var in pair_vars.items()
    )
    model.Maximize(objective_expr)

    # ── 5. Execute Solver with Timeout ─────────────────────────
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(timeout_sec)
    solver.parameters.num_workers = 4
    solver.parameters.log_search_progress = False

    solver_status_code = solver.Solve(model)
    t_elapsed_ms = (_time.perf_counter() - t_start) * 1000.0

    # ── 6. Process Solver Results & Fallbacks ──────────────────
    is_optimal = solver_status_code == cp_model.OPTIMAL
    is_feasible = solver_status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE)

    status_name_map = {
        cp_model.OPTIMAL: "OPTIMAL",
        cp_model.FEASIBLE: "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.MODEL_INVALID: "MODEL_INVALID",
        cp_model.UNKNOWN: "TIMEOUT" if t_elapsed_ms >= (timeout_sec * 900) else "NO_SOLUTION",
    }
    solver_status_str = status_name_map.get(solver_status_code, "UNKNOWN")

    scheduled_blocks: List[ScheduledBlock] = []
    covered_request_ids: Set[UUID] = set()
    total_ci = 0.0
    total_shadow_hours = 0.0
    total_detention = 0

    if is_feasible:
        # Extract selected assignments
        selected_pairs: List[Tuple[int, int]] = []
        for pair, var in pair_vars.items():
            if solver.Value(var) == 1:
                selected_pairs.append(pair)

        # Sort selected blocks chronologically by gap start time
        selected_pairs.sort(key=lambda p: (gaps[p[1]].start_datetime, candidate_blocks[p[0]].section_id))

        for m_idx, g_idx in selected_pairs:
            block = candidate_blocks[m_idx]
            gap = gaps[g_idx]
            detention = detention_for_pair.get((m_idx, g_idx), 0)

            block_start_dt = gap.start_datetime
            block_end_dt = block_start_dt + timedelta(minutes=block.duration_minutes)

            # Generate unique block code
            seq_num = len(scheduled_blocks) + 1
            block_code = f"BLK-{gap.target_date.strftime('%Y%m%d')}-{seq_num:03d}"

            scheduled = ScheduledBlock(
                id=uuid4(),
                candidate_block_id=block.id,
                corridor_gap_id=gap.id,
                section_id=gap.section_id,
                section_code=block.section_code,
                block_date=gap.target_date,
                start_time=block_start_dt.time(),
                end_time=block_end_dt.time(),
                start_datetime=block_start_dt,
                end_datetime=block_end_dt,
                duration_minutes=block.duration_minutes,
                is_joint_shadow_block=block.is_joint_shadow_block,
                primary_department=block.primary_department,
                participating_departments=block.participating_departments,
                total_criticality_index=block.total_criticality_index,
                shadow_overlap_hours=block.shadow_overlap_hours,
                estimated_train_detention_minutes=detention,
                activities=block.activities,
                requests_covered_ids=block.requests_covered_ids,
                line_direction=gap.line_direction,
                traction_power_isolation=block.traction_power_isolation,
                feeding_post_section=block.feeding_post_section,
                status=BlockStatusEnum.PROPOSED,
                block_code=block_code,
                optimizer_metadata={
                    "assigned_corridor_gap_id": str(gap.id),
                    "gap_duration_minutes": gap.duration_minutes,
                    "safety_buffer_minutes": gap.safety_buffer_minutes,
                    "has_vip_train_proximity": gap.has_vip_train_proximity,
                    "preceding_train_number": gap.preceding_train_number,
                    "following_train_number": gap.following_train_number,
                },
            )
            scheduled_blocks.append(scheduled)
            covered_request_ids.update(block.requests_covered_ids)
            total_ci += block.total_criticality_index
            total_shadow_hours += block.shadow_overlap_hours
            total_detention += detention

    unassigned_ids = sorted(list(known_request_ids - covered_request_ids), key=str)
    objective_val = (solver.ObjectiveValue() / 1000.0) if is_feasible else 0.0

    return OptimizationResult(
        run_id=run_id,
        target_date=effective_date,
        solver_status=solver_status_str,
        is_optimal=is_optimal,
        is_feasible=is_feasible,
        total_blocks_scheduled=len(scheduled_blocks),
        total_maintenance_requests_covered=len(covered_request_ids),
        total_unassigned_requests=len(unassigned_ids),
        total_shadow_overlap_hours=round(total_shadow_hours, 2),
        total_train_detention_minutes=total_detention,
        total_criticality_index=round(total_ci, 2),
        objective_value=round(objective_val, 4) if is_feasible else None,
        solver_execution_time_ms=round(t_elapsed_ms, 2),
        scheduled_blocks=scheduled_blocks,
        unassigned_request_ids=unassigned_ids,
        metadata={
            "alpha_shadow_weight": alpha,
            "beta_detention_weight": beta,
            "solver_timeout_seconds": timeout_sec,
            "num_decision_variables": len(pair_vars),
            "num_gaps_considered": len(gaps),
            "num_candidate_blocks_considered": len(candidate_blocks),
        },
    )


# ── Full Optimization Pipeline Orchestrator ─────────────────


def run_optimization_pipeline(
    movements: Sequence[Any],
    requests: Sequence[Any],
    resources: Optional[Sequence[Any]] = None,
    compatibility_rules: Optional[Sequence[Any]] = None,
    target_date: Optional[date] = None,
    section_id: Optional[UUID] = None,
    section_code_map: Optional[Dict[UUID, str]] = None,
    safety_buffer_minutes: Optional[int] = None,
    min_gap_minutes: Optional[int] = None,
    alpha_shadow: Optional[float] = None,
    beta_detention: Optional[float] = None,
    max_solver_time_seconds: Optional[int] = None,
    horizon_days: int = 1,
) -> OptimizationResult:
    """Run the complete end-to-end RailBlock Stage 3 -> 4 -> 5 optimization pipeline.

    1. Stage 3 (gap_extractor): Extracts unoccupied corridor gaps from timetabled train movements.
    2. Stage 4 (clustering): Groups pending maintenance requests into candidate Joint Shadow Blocks.
    3. Stage 5 (optimizer): Mixed-integer linear programming (MILP / CP-SAT) space-time scheduling.

    Args:
        movements: Sequence of timetabled TrainMovement records.
        requests: Sequence of pending MaintenanceRequest records.
        resources: Optional sequence of Resource equipment/crew objects.
        compatibility_rules: Optional sequence of CompatibilityRule G&SR entities.
        target_date: Target planning date (defaults to today).
        section_id: Optional Section UUID to restrict planning to a single section.
        section_code_map: Optional map of section UUIDs to human-readable section codes.
        safety_buffer_minutes: Statutory safety buffer in minutes (default: 15 mins).
        min_gap_minutes: Minimum duration for corridor gap extraction (default: 60 mins).
        alpha_shadow: Solver objective weight for shadow overlap hours (default: 1.5).
        beta_detention: Solver penalty weight for detention minutes (default: 0.8).
        max_solver_time_seconds: Maximum solver execution time in seconds (default: 30s).
        horizon_days: Planning horizon in days (default: 1).

    Returns:
        OptimizationResult frozen dataclass with complete schedule and statistics.
    """
    effective_date = target_date or date.today()
    sec_buffer = safety_buffer_minutes if safety_buffer_minutes is not None else settings.DEFAULT_SAFETY_BUFFER_MINUTES
    gap_min = min_gap_minutes if min_gap_minutes is not None else settings.DEFAULT_MIN_GAP_MINUTES

    # 1. Determine target sections to process
    target_sections: Set[UUID] = set()
    if section_id is not None:
        target_sections.add(section_id)
    else:
        for m in movements:
            s_id = getattr(m, "section_id", None)
            if s_id is not None:
                target_sections.add(s_id)
        for r in requests:
            s_id = getattr(r, "section_id", None)
            if s_id is not None:
                target_sections.add(s_id)

    # 2. Extract Corridor Gaps across all sections (Stage 3)
    all_gaps: List[CorridorGap] = []
    for s_id in target_sections:
        sec_gaps = extract_corridor_gaps(
            movements=movements,
            target_date=effective_date,
            section_id=s_id,
            min_gap_minutes=gap_min,
            safety_buffer_minutes=sec_buffer,
            horizon_days=horizon_days,
        )
        all_gaps.extend(sec_gaps)

    # 3. Cluster Maintenance Requests into Candidate Shadow Blocks (Stage 4)
    candidate_blocks = cluster_shadow_blocks(
        requests=requests,
        compatibility_rules=compatibility_rules,
        target_date=effective_date,
        section_code_map=section_code_map,
    )

    # 4. Solve Space-Time Constraint Optimization Problem (Stage 5)
    all_req_ids = [getattr(r, "id", None) for r in requests if getattr(r, "id", None) is not None]

    return solve_block_schedule(
        gaps=all_gaps,
        candidate_blocks=candidate_blocks,
        resources=resources,
        alpha_shadow=alpha_shadow,
        beta_detention=beta_detention,
        max_solver_time_seconds=max_solver_time_seconds,
        target_date=effective_date,
        all_request_ids=all_req_ids,
    )
