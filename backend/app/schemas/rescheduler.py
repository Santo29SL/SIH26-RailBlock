"""Pydantic schemas for Real-Time Fast Rescheduler and Single Line Working (SLW) Fallback.

Follows the canonical terminology defined in CONTEXT.md:
- Section: Distinct physical track segment between consecutive block stations.
- Corridor Gap: Continuous unoccupied time interval.
- Safety Buffer: Statutory minimum time headway enforced before and after train passage (>= 15 mins).
- Single Line Working (SLW): Emergency operational protocol under G&SR where trains move bidirectionally over a single track.
- Block / Joint Shadow Block: Officially granted possession window.
- Private Number (PN): Confidential unique numeric token exchanged between Station Master and Field Engineer.
"""

from __future__ import annotations

import enum
from datetime import date, datetime, time
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import DepartmentEnum, LineTypeEnum, TrainPriorityEnum, TrainTypeEnum
from app.schemas.optimizer import ScheduledBlockSummary


class RescheduleActionEnum(str, enum.Enum):
    """Action taken by the real-time fast rescheduler."""

    TIME_SHIFT = "TIME_SHIFT"
    SLW_ADVISORY = "SLW_ADVISORY"
    BUFFER_ABSORBED = "BUFFER_ABSORBED"
    SECTION_BLOCKADE = "SECTION_BLOCKADE"
    OVERRUN_WARNING = "OVERRUN_WARNING"
    NO_ACTION = "NO_ACTION"


class SLWAdvisorySchema(BaseModel):
    """Statutory Single Line Working (SLW) emergency advisory notice under Indian Railways GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15."""

    model_config = ConfigDict(from_attributes=True)

    advisory_id: UUID = Field(..., description="Unique identifier for the SLW advisory notice")
    timestamp: datetime = Field(..., description="Timestamp when the SLW emergency advisory was issued")
    gsr_rule_reference: str = Field(
        default="GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15 — Temporary Single Line Working (TSLW) on Double Line",
        description="Statutory G&SR operating rule reference",
    )
    section_code: str = Field(..., description="Section identifier code", examples=["MAS-AJJ"])
    section_name: Optional[str] = Field(None, description="Human-readable section name", examples=["Chennai Central - Arakkonam"])
    obstructed_line: str = Field(..., description="Track line obstructed by maintenance overrun", examples=["UP Main Line"])
    single_line_in_use: str = Field(..., description="Operational track line assigned for bidirectional SLW", examples=["DOWN Main Line"])
    pilot_train_number: Optional[str] = Field(None, description="First pilot train authorized to traverse single line", examples=["12621"])
    pilot_train_name: Optional[str] = Field(None, description="Pilot train name", examples=["Tamil Nadu Express"])
    first_pilot_speed_kmph: int = Field(default=25, description="Statutory maximum speed in km/h for the first pilot train under GR 3.68 / SR 4.09")
    subsequent_train_speed_kmph: int = Field(default=40, description="Booked speed with 40 km/h automatic wrong-direction cap for subsequent follow-up trains")
    facing_points_speed_kmph: int = Field(default=15, description="Statutory maximum speed in km/h over facing points and crossovers")
    freight_siding_orders: List[str] = Field(default_factory=list, description="Controller decision support for regulating freight/goods rakes in sidings")
    queued_train_priorities: List[str] = Field(default_factory=list, description="Priority passenger trains queued at block stations")
    private_number: Optional[str] = Field(None, description="Station Master Private Number (PN) exchanged for SLW introduction", examples=["PN-7392"])
    advisory_text: str = Field(..., description="Pre-formatted statutory Indian Railways Single Line Working (SLW) operational safety advisory notice")
    td602_authority_sheet: Optional[Dict[str, Any]] = Field(None, description="Form T/D 602 Line Clear Ticket + Authority to Pass Signals + Caution Order sheet")
    controller_phone_script: Optional[str] = Field(None, description="Verbatim Section Controller control-phone dispatch script")


class RescheduleRequest(BaseModel):
    """Request payload to evaluate a live disruption and execute real-time rescheduling."""

    model_config = ConfigDict(from_attributes=True)

    active_block: ScheduledBlockSummary = Field(..., description="The currently active or upcoming scheduled block")
    delay_minutes: int = Field(..., description="Live train delay or block overrun duration in minutes")
    impacted_train_number: str = Field(..., description="Train number causing the delay or waiting at block boundary", examples=["12621"])
    impacted_train_name: Optional[str] = Field(None, description="Name of the impacted train", examples=["Tamil Nadu Express"])
    impacted_train_priority: Optional[TrainPriorityEnum] = Field(default=TrainPriorityEnum.HIGH, description="Priority classification of the impacted train")
    impacted_train_type: Optional[TrainTypeEnum] = Field(default=TrainTypeEnum.EXPRESS, description="Type of the impacted train")
    is_block_overrun: bool = Field(default=False, description="True if the active maintenance block has overran its granted window")
    has_queued_trains: bool = Field(default=False, description="True if trains are held/queued at adjacent block stations")
    parallel_line_available: bool = True
    line_type: LineTypeEnum = Field(default=LineTypeEnum.DOUBLE, description="Track topology (SINGLE, DOUBLE, TRIPLE, QUADRUPLE)")
    section_code: Optional[str] = Field(None, description="Section code override if not inferred from active block")
    section_name: Optional[str] = Field(None, description="Human-readable section name")
    division: Optional[str] = Field(None, description="Railway division", examples=["Chennai"])
    zone: Optional[str] = Field(None, description="Railway zone", examples=["Southern Railway"])
    queued_train_numbers: Optional[List[str]] = Field(default=None, description="List of train numbers currently queued")
    freight_rakes_to_hold: Optional[List[str]] = Field(default=None, description="List of freight train rakes to regulate in sidings")
    pilot_train_number: Optional[str] = Field(None, description="Specific train number selected as the first pilot train")
    private_number: Optional[str] = Field(None, description="Station Master Private Number (PN) for authentication")
    reason: Optional[str] = Field(None, description="Disruption description (e.g. 'Tamping Machine Engine Failure', 'Signal Cable Fault')")


class RescheduleResponse(BaseModel):
    """Response payload returned by the real-time fast rescheduler service."""

    model_config = ConfigDict(from_attributes=True)

    outcome_id: UUID = Field(..., description="Unique outcome identifier")
    action_taken: RescheduleActionEnum = Field(..., description="Action category executed by the rescheduler")
    success: bool = Field(..., description="True if rescheduling / advisory completed successfully")
    delay_minutes: int = Field(..., description="Evaluated delay in minutes")
    is_block_overrun: bool = Field(..., description="Whether disruption was classified as a block overrun")
    has_queued_trains: bool = Field(..., description="Whether queued trains required regulation")
    original_start_time: time
    original_end_time: time
    new_start_time: Optional[time] = None
    new_end_time: Optional[time] = None
    original_start_datetime: Optional[datetime] = None
    original_end_datetime: Optional[datetime] = None
    new_start_datetime: Optional[datetime] = None
    new_end_datetime: Optional[datetime] = None
    shifted_block: Optional[ScheduledBlockSummary] = None
    slw_advisory: Optional[SLWAdvisorySchema] = None
    affected_trains_count: int = Field(default=0, ge=0)
    execution_time_ms: float = Field(..., ge=0.0, description="Execution duration in milliseconds (<1000ms SLA)")
    reason: str = Field(..., description="Operational explanation of the action taken")
    advisory_notes: List[str] = Field(default_factory=list, description="Bullet points for Section Controller situational awareness")
