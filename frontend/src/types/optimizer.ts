import { Department, BlockStatus } from './block';
import { TrainType, TrainPriority } from './section';

export type DetentionTier = 1 | 2 | 3; // 1: VIP (Rajdhani/Vande Bharat), 2: Express/Passenger, 3: Freight

export interface ScheduledBlockJobSummary {
  id?: string;
  maintenance_request_id: string;
  request_code: string;
  department: Department;
  activity_type: string;
  duration_minutes: number;
  start_offset_minutes: number;
  end_offset_minutes: number;
  criticality_index: number;
  is_primary: boolean;
}

export interface ScheduledBlockSummary {
  id?: string;
  block_code: string;
  section_id: string;
  section_code?: string;
  block_date: string;
  start_time: string; // "HH:MM:SS"
  end_time: string;   // "HH:MM:SS"
  duration_minutes: number;
  is_joint_shadow_block: boolean;
  primary_department: Department;
  participating_departments: Department[];
  total_criticality_index: number;
  shadow_overlap_hours: number;
  estimated_train_detention_minutes: number;
  status: BlockStatus;
  optimizer_metadata?: Record<string, any>;
  jobs: ScheduledBlockJobSummary[];
}

export interface OptimizerRunRequest {
  target_date: string; // "YYYY-MM-DD"
  section_ids?: string[];
  horizon_days?: number;
  safety_buffer_minutes?: number;
  min_gap_minutes?: number;
  alpha_shadow_weight?: number;
  beta_detention_weight?: number;
  solver_timeout_seconds?: number;
  persist_to_db?: boolean;
}

export interface OptimizerRunResponse {
  run_id: string;
  target_date: string;
  solver_status: string;
  total_blocks_scheduled: int;
  total_maintenance_requests_covered: number;
  total_unassigned_requests: number;
  total_shadow_overlap_hours: number;
  total_train_detention_minutes: number;
  total_criticality_index: number;
  objective_value?: number;
  solver_execution_time_ms: number;
  scheduled_blocks: ScheduledBlockSummary[];
  unassigned_request_ids: string[];
}

export interface ConflictingTrainImpact {
  train_id: string;
  train_number: string;
  train_name: string;
  train_type: TrainType;
  priority: TrainPriority;
  scheduled_departure: string;
  scheduled_arrival: string;
  expected_detention_minutes: number;
  detention_penalty_tier: DetentionTier;
  is_hard_conflict: boolean;
}

export interface WhatIfSimulationRequest {
  simulation_name?: string;
  block_id?: string;
  section_id: string;
  target_date: string;
  start_time: string; // "HH:MM:SS"
  end_time: string;   // "HH:MM:SS"
  maintenance_request_ids: string[];
  allow_slw_fallback?: boolean;
}

export interface WhatIfSimulationResponse {
  simulation_id: string;
  is_feasible: boolean;
  has_vip_train_conflict: boolean;
  detention_delta_minutes: number;
  total_detention_minutes: number;
  conflicting_trains_count: number;
  conflicting_trains: ConflictingTrainImpact[];
  risk_score_delta: number;
  criticality_index_preserved_pct: number;
  shadow_efficiency_score: number;
  slw_advisory_required: boolean;
  commit_token: string;
  expires_at: string;
}

export interface CommitSimulationRequest {
  commit_token: string;
  approved_by?: string;
  notes?: string;
}

export interface CommitSimulationResponse {
  success: boolean;
  message: string;
  block_id: string;
  block_code: string;
  committed_at: string;
}

export interface RescheduleRequest {
  active_block: ScheduledBlockSummary;
  delay_minutes: number;
  impacted_train_number: string;
  impacted_train_name?: string;
  impacted_train_priority?: TrainPriority;
  impacted_train_type?: TrainType;
  is_block_overrun?: boolean;
  has_queued_trains?: boolean;
  parallel_line_available?: boolean;
  line_type?: string;
  section_code?: string;
  section_name?: string;
  division?: string;
  zone?: string;
  queued_train_numbers?: string[];
  freight_rakes_to_hold?: string[];
  pilot_train_number?: string;
  private_number?: string;
  reason?: string;
}

export interface RescheduleResponse {
  outcome_id: string;
  action_taken: 'TIME_SHIFT' | 'SLW_ADVISORY' | 'BUFFER_ABSORBED' | 'SECTION_BLOCKADE' | 'OVERRUN_WARNING' | 'NO_ACTION';
  success: boolean;
  delay_minutes: number;
  is_block_overrun: boolean;
  has_queued_trains: boolean;
  shifted_start_time?: string;
  shifted_end_time?: string;
  safety_buffer_consumed_minutes?: number;
  slw_advisory?: any;
  rescheduled_block?: ScheduledBlockSummary;
  controller_action_summary: string;
  reasoning: string;
}
