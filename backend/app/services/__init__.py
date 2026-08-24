"""Backend services package for RailBlock."""

from __future__ import annotations

from app.services.gap_extractor import CorridorGap, extract_corridor_gaps

__all__ = [
    "CorridorGap",
    "extract_corridor_gaps",
]
