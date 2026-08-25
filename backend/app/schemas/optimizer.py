"""Optimizer, What-If simulation, and statutory export schemas.

Follows the canonical terminology defined in CONTEXT.md:
- Section, Feeding Post (FP) / Sectioning Post (SP)
- Corridor Gap, Safety Buffer, Temporary Speed Restriction (TSR), Single Line Working (SLW)
- Maintenance Request, Block, Joint Shadow Block, Primary Block, Shadow Activity
- Criticality Index (CI), G&SR, Form T/351, Private Number (PN)
"""

from __future__ import annotations

import enum
from datetime import date, datetime, time
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import (
    BlockStatusEnum,
    DepartmentEnum,
    LineTypeEnum,
    PriorityEnum,
    TrainPriorityEnum,
    TrainTypeEnum,
)


# ── Domain Enums for Optimizer & Detention Tiers ─────────


class DetentionTierEnum(int, enum.Enum):
    """Tiered train detention classification under ADR 0003."""

    TIER_1_VIP = 1  # Rajdhani, Vande Bharat, Shatabdi (Zero detention hard constraint)
    TIER_2_EXPRESS = 2  # Express, Superfast, Passenger (High penalty linear detention)
    TIER_3_FREIGHT = 3  # Goods / Freight (Low penalty regulation)


# ── Optimizer Run Schemas ────────────────────────────────


class OptimizerRunRequest(BaseModel):
    """Request payload to trigger the automated block optimizer engine."""

    model_config = ConfigDict(from_attributes=True)

    target_date: date = Field(
        ...,
        description="Target planning date for corridor gap allocation",
        examples=["2026-08-25"],
    )
    section_ids: Optional[List[UUID]] = Field(
        default=None,
        description="List of section UUIDs to optimize. If omitted/null, optimizes across all active sections.",
    )
    horizon_days: int = Field(
        default=1,
        ge=1,
        le=7,
        description="Rolling planning horizon in days (1-7 days)",
    )
    safety_buffer_minutes: Optional[int] = Field(
        default=None,
        ge=0,
        description="Statutory minimum safety buffer before/after train passage. Defaults to app settings (15 mins).",
    )
    min_gap_minutes: Optional[int] = Field(
        default=None,
        ge=15,
        description="Minimum duration of an unoccupied corridor gap. Defaults to app settings (60 mins).",
    )
    alpha_shadow_weight: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Solver objective weight for shadow activity overlap hours. Defaults to app settings (1.5).",
    )
    beta_detention_weight: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Solver objective penalty weight for train detention minutes. Defaults to app settings (0.8).",
    )
    solver_timeout_seconds: Optional[int] = Field(
        default=None,
        ge=1,
        le=300,
        description="Maximum solver execution time in seconds before returning best-feasible solution. Defaults to app settings (30s).",
    )
    persist_to_db: bool = Field(
        default=True,
        description="If True, persists scheduled Block and BlockJob records to PostgreSQL.",
    )


class ScheduledBlockJobSummary(BaseModel):
    """Summary of an individual maintenance activity scheduled inside a Block."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[UUID] = None
    maintenance_request_id: UUID
    request_code: str = Field(..., examples=["MR-TRK-001"])
    department: DepartmentEnum
    activity_type: str = Field(..., examples=["Machine Tamping"])
    duration_minutes: int = Field(..., gt=0)
    start_offset_minutes: int = Field(
        default=0,
        ge=0,
        description="Offset in minutes from the Primary Block start time when this activity begins",
    )
    end_offset_minutes: int = Field(
        default=0,
        ge=0,
        description="Offset in minutes from the Primary Block start time when this activity finishes",
    )
    criticality_index: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Criticality Index (0-100) of this maintenance request",
    )
    is_primary: bool = Field(
        default=False,
        description="True if this is the anchor Primary Block activity defining the window",
    )


class ScheduledBlockSummary(BaseModel):
    """Summary of a scheduled maintenance block produced by the optimizer."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[UUID] = None
    block_code: str = Field(..., examples=["BLK-20260825-001"])
    section_id: UUID
    section_code: Optional[str] = Field(None, examples=["MAS-AJJ"])
    block_date: date
    start_time: time
    end_time: time
    duration_minutes: int = Field(..., gt=0)
    is_joint_shadow_block: bool = Field(
        default=False,
        description="True if bundling compatible requests from multiple departments",
    )
    primary_department: DepartmentEnum
    participating_departments: List[DepartmentEnum] = Field(default_factory=list)
    total_criticality_index: float = Field(
        default=0.0,
        ge=0.0,
        description="Sum of Criticality Index scores of all bundled activities",
    )
    shadow_overlap_hours: float = Field(
        default=0.0,
        ge=0.0,
        description="Effective labor hours saved through concurrent shadow possession",
    )
    estimated_train_detention_minutes: int = Field(
        default=0,
        ge=0,
        description="Total train delay minutes induced by this possession",
    )
    status: BlockStatusEnum = Field(default=BlockStatusEnum.PROPOSED)
    optimizer_metadata: Optional[Dict[str, Any]] = None
    jobs: List[ScheduledBlockJobSummary] = Field(default_factory=list)


class OptimizerRunResponse(BaseModel):
    """Response payload returned by the block optimizer engine."""

    model_config = ConfigDict(from_attributes=True)

    run_id: UUID
    target_date: date
    solver_status: str = Field(
        ...,
        description="Status string returned by solver (OPTIMAL, FEASIBLE, INFEASIBLE, NO_SOLUTION)",
        examples=["OPTIMAL"],
    )
    total_blocks_scheduled: int = Field(..., ge=0)
    total_maintenance_requests_covered: int = Field(..., ge=0)
    total_unassigned_requests: int = Field(..., ge=0)
    total_shadow_overlap_hours: float = Field(..., ge=0.0)
    total_train_detention_minutes: int = Field(..., ge=0)
    total_criticality_index: float = Field(
        ...,
        ge=0.0,
        description="Aggregated Criticality Index across all scheduled maintenance blocks",
    )
    objective_value: Optional[float] = None
    solver_execution_time_ms: float = Field(..., ge=0.0)
    scheduled_blocks: List[ScheduledBlockSummary] = Field(default_factory=list)
    unassigned_request_ids: List[UUID] = Field(default_factory=list)


# ── What-If Simulation Schemas ───────────────────────────


class ConflictingTrainImpact(BaseModel):
    """Details of an impacted train during What-If simulation."""

    model_config = ConfigDict(from_attributes=True)

    train_id: UUID
    train_number: str = Field(..., examples=["12621"])
    train_name: str = Field(..., examples=["Tamil Nadu Express"])
    train_type: TrainTypeEnum
    priority: TrainPriorityEnum
    scheduled_departure: time
    scheduled_arrival: time
    expected_detention_minutes: int = Field(..., ge=0)
    detention_penalty_tier: DetentionTierEnum = Field(
        ...,
        description="Tier 1 (VIP), Tier 2 (Express/Passenger), Tier 3 (Freight)",
    )
    is_hard_conflict: bool = Field(
        default=False,
        description="True if Tier 1 VIP zero-detention rule is violated",
    )


class WhatIfSimulationRequest(BaseModel):
    """In-memory What-If simulation request payload."""

    model_config = ConfigDict(from_attributes=True)

    simulation_name: Optional[str] = Field(None, max_length=100)
    block_id: Optional[UUID] = Field(
        None,
        description="Optional existing Block UUID if simulating a shift/modification",
    )
    section_id: UUID
    target_date: date
    start_time: time
    end_time: time
    maintenance_request_ids: List[UUID] = Field(
        ...,
        min_length=1,
        description="List of maintenance requests to bundle into the simulated block",
    )
    allow_slw_fallback: bool = Field(
        default=False,
        description="Simulate under Single Line Working (SLW) protocol for double line sections",
    )


class WhatIfSimulationResponse(BaseModel):
    """Real-time in-memory What-If simulation result with commit token."""

    model_config = ConfigDict(from_attributes=True)

    simulation_id: UUID
    is_feasible: bool = Field(
        ...,
        description="True if the proposed window does not violate hard safety or VIP constraints",
    )
    has_vip_train_conflict: bool = Field(
        default=False,
        description="True if Tier 1 VIP zero-detention constraint is violated",
    )
    detention_delta_minutes: int = Field(
        ...,
        description="Change in total train detention minutes compared to baseline schedule",
    )
    total_detention_minutes: int = Field(
        ...,
        ge=0,
        description="Total detention minutes incurred by all affected trains",
    )
    conflicting_trains_count: int = Field(..., ge=0)
    conflicting_trains: List[ConflictingTrainImpact] = Field(default_factory=list)
    risk_score_delta: float = Field(
        ...,
        description="Change in composite safety/operational risk score",
    )
    criticality_index_preserved_pct: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage of pending defect Criticality Index resolved by this proposed window",
    )
    shadow_efficiency_score: float = Field(
        ...,
        ge=0.0,
        description="Shadow block bundling efficiency score",
    )
    slw_advisory_required: bool = Field(
        default=False,
        description="True if Single Line Working (SLW) G&SR Chapter 5/15 advisory is recommended",
    )
    commit_token: str = Field(
        ...,
        description="Cryptographically signed HMAC token verifying this in-memory simulation state for commit",
    )
    expires_at: datetime = Field(
        ...,
        description="Timestamp when the commit token expires (default 15 minutes)",
    )


class CommitSimulationRequest(BaseModel):
    """Request payload to commit a verified What-If simulation to PostgreSQL."""

    model_config = ConfigDict(from_attributes=True)

    commit_token: str = Field(
        ...,
        description="Cryptographically signed commit token from What-If simulation response",
    )
    approved_by: Optional[str] = Field(
        None,
        max_length=100,
        description="Identifier / designation of the railway official approving the commit",
    )
    notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional operational justification or audit notes",
    )


class CommitSimulationResponse(BaseModel):
    """Response payload returned when a simulated block is committed to the database."""

    model_config = ConfigDict(from_attributes=True)

    success: bool
    message: str
    block_id: UUID
    block_code: str
    committed_at: datetime


# ── Statutory Export Schemas (CRIS BDMS & Form T/351) ────


class BDMSShadowActivity(BaseModel):
    """Shadow activity record for CRIS BDMS integration."""

    model_config = ConfigDict(from_attributes=True)

    request_code: str = Field(..., examples=["MR-SIG-004"])
    department: DepartmentEnum = Field(..., examples=[DepartmentEnum.SIGNAL])
    activity_type: str = Field(..., examples=["Point Machine Testing"])
    start_offset_minutes: int = Field(default=0, ge=0)
    duration_minutes: int = Field(..., gt=0)
    criticality_index: float = Field(default=0.0, ge=0.0, le=100.0)
    resources_required: List[str] = Field(default_factory=list)


class BDMSExportPayload(BaseModel):
    """CRIS BDMS (Block Demand & Management System) standard JSON export payload."""

    model_config = ConfigDict(from_attributes=True)

    bdms_message_id: str = Field(..., examples=["BDMS-20260825-MAS-001"])
    message_version: str = Field(default="1.0")
    timestamp: datetime
    division: str = Field(..., examples=["Chennai"])
    zone: str = Field(..., examples=["Southern Railway"])
    section_code: str = Field(..., examples=["MAS-AJJ"])
    section_name: str = Field(..., examples=["Chennai Central - Arakkonam"])
    block_code: str = Field(..., examples=["BLK-20260825-001"])
    block_type: str = Field(
        ...,
        description="PRIMARY, JOINT_SHADOW, or EMERGENCY",
        examples=["JOINT_SHADOW"],
    )
    line_direction: str = Field(
        ...,
        description="UP, DOWN, or BOTH",
        examples=["UP"],
    )
    block_date: date
    granted_start_time: time
    granted_end_time: time
    total_duration_minutes: int = Field(..., gt=0)
    primary_department: DepartmentEnum = Field(..., examples=[DepartmentEnum.TRACK])
    participating_departments: List[DepartmentEnum] = Field(
        ..., examples=[[DepartmentEnum.TRACK, DepartmentEnum.SIGNAL]]
    )
    traction_power_isolation: bool = Field(
        default=False,
        description="Indicates whether OHE power isolation (FP/SP) is required",
    )
    feeding_post_section: Optional[str] = Field(
        None,
        description="Feeding Post (FP) / Sectioning Post (SP) isolation boundary reference",
        examples=["FP-KOK-SP-TRL"],
    )
    tsr_imposed: bool = Field(
        default=False,
        description="Indicates whether Temporary Speed Restriction is imposed post-work",
    )
    tsr_speed_kmph: Optional[int] = Field(
        None,
        description="Imposed TSR restricted velocity in km/h if applicable",
        examples=[30],
    )
    demanding_official: Optional[str] = Field(None, examples=["Sr. DEN/Track/MAS"])
    authorizing_controller: Optional[str] = Field(None, examples=["CPRC/Control/MAS"])
    primary_activity: str = Field(..., examples=["Machine Tamping"])
    shadow_activities: List[BDMSShadowActivity] = Field(default_factory=list)
    status: str = Field(
        ...,
        description="BDMS block status: PROPOSED, APPROVED, SANCTIONED",
        examples=["PROPOSED"],
    )


class FormT351NoticePayload(BaseModel):
    """Statutory Indian Railways Form T/351 Disconnection and Reconnection Notice payload.

    Under G&SR regulations, disconnections and reconnections require authenticated
    Station Master Private Numbers (PN) exchanged with the Field Engineer.
    """

    model_config = ConfigDict(from_attributes=True)

    form_type: str = Field(
        default="T/351",
        description="Statutory Form identifier (T/351 for Disconnection, T/351-B for Reconnection)",
    )
    notice_number: str = Field(..., examples=["T351/MAS/2026/0825/01"])
    station_code: str = Field(..., examples=["MAS"])
    section_code: str = Field(..., examples=["MAS-AJJ"])
    date: date
    disconnection_time: time
    line_affected: str = Field(..., examples=["Up Main Line"])
    work_nature: str = Field(
        ...,
        examples=["Deep Screening and Machine Tamping between KM 142.0 and 145.0"],
    )
    department: DepartmentEnum
    disconnection_private_number: str = Field(
        ...,
        description="Statutory Station Master Private Number (PN) legally authenticating Disconnection grant",
        examples=["PN-4821"],
    )
    station_master_name: str = Field(..., examples=["R. K. Sharma"])
    field_engineer_name: str = Field(..., examples=["P. V. Nair"])
    field_engineer_designation: str = Field(..., examples=["SSE/Permanent Way/MAS"])
    reconnection_private_number: Optional[str] = Field(
        None,
        description="Station Master Private Number (PN) legally authenticating track Reconnection and clearance",
        examples=["PN-4899"],
    )
    reconnection_time: Optional[time] = None
    tsr_imposed: bool = Field(
        default=False,
        description="True if Temporary Speed Restriction (TSR) is mandated following reconnection",
    )
    tsr_speed_kmph: Optional[int] = Field(
        None,
        description="Caution order restricted velocity in km/h under TSR",
        examples=[45],
    )
    remarks: Optional[str] = None
    status: str = Field(
        default="DISCONNECTED",
        description="Disconnection state: DISCONNECTED, RECONNECTED, or ACKNOWLEDGED",
        examples=["DISCONNECTED"],
    )
