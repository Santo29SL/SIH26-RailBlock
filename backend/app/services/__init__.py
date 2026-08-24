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
]
