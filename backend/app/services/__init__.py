"""Backend services package for RailBlock."""

from __future__ import annotations

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
from app.services.gap_extractor import CorridorGap, extract_corridor_gaps
from app.services.optimizer import (
    OptimizationResult,
    ScheduledBlock,
    run_optimization_pipeline,
    solve_block_schedule,
)

__all__ = [
    "CorridorGap",
    "extract_corridor_gaps",
    "CandidateShadowBlock",
    "ShadowActivityAssignment",
    "are_spatially_compatible",
    "are_traction_power_compatible",
    "cluster_shadow_blocks",
    "compute_criticality_index",
    "is_cluster_compatible",
    "is_pair_compatible",
    "ScheduledBlock",
    "OptimizationResult",
    "solve_block_schedule",
    "run_optimization_pipeline",
]
