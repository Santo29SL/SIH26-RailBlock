/**
 * RailBlock API Client
 * Live calls to FastAPI backend at http://localhost:8000/api/v1
 * No fallback/static data — all data comes from the database.
 */

const BASE = 'http://localhost:8000/api/v1';

// ── Generic fetch wrapper ─────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { detail = (await res.json())?.detail ?? detail; } catch { /* */ }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

// ── Types mirroring backend schemas ──────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Section {
  id: string;
  section_code: string;
  section_name: string;
  division: string;
  zone: string;
  length_km: number;
  line_type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUADRUPLE';
  created_at: string;
  updated_at: string;
}

export interface Train {
  id: string;
  train_number: string;
  train_name: string;
  train_type: 'EXPRESS' | 'SUPERFAST' | 'MAIL' | 'LOCAL' | 'FREIGHT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
  updated_at: string;
}

export interface TrainMovement {
  id: string;
  train_id: string;
  section_id: string;
  departure_time: string;
  arrival_time: string;
  day_of_week: number;
  movement_type: 'SCHEDULED' | 'FORECAST_FREIGHT';
  is_active: boolean;
  created_at: string;
  // Joined train data
  train?: Train;
}

export interface MaintenanceRequest {
  id: string;
  request_code: string;
  section_id: string;
  department: 'TRACK' | 'SIGNAL' | 'TRACTION';
  activity_type: string;
  duration_minutes: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deadline: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  resource_id?: string;
  metadata_json?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BlockJob {
  id: string;
  maintenance_request_id: string;
  sequence_order: number;
  created_at: string;
}

export interface Block {
  id: string;
  block_code: string;
  section_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  train_impact_count: number;
  impact_score: number;
  status: 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  optimizer_metadata?: Record<string, unknown>;
  block_jobs: BlockJob[];
  created_at: string;
  updated_at: string;
}

export interface BlockTransitionRequest {
  target_status: 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  private_number?: string;
  disconnection_private_number?: string;
  reconnection_private_number?: string;
  station_master_name?: string;
  field_engineer_name?: string;
  field_engineer_designation?: string;
  disconnection_time?: string;
  reconnection_time?: string;
  tsr_imposed?: boolean;
  tsr_speed_kmph?: number;
  approved_by?: string;
  remarks?: string;
}

export interface ScheduledBlockJob {
  id?: string;
  maintenance_request_id: string;
  request_code: string;
  department: 'TRACK' | 'SIGNAL' | 'TRACTION';
  activity_type: string;
  duration_minutes: number;
  start_offset_minutes: number;
  end_offset_minutes: number;
  criticality_index: number;
  is_primary: boolean;
}

export interface ScheduledBlock {
  id?: string;
  block_code: string;
  section_id: string;
  section_code?: string;
  block_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_joint_shadow_block: boolean;
  primary_department: 'TRACK' | 'SIGNAL' | 'TRACTION';
  participating_departments: string[];
  total_criticality_index: number;
  shadow_overlap_hours: number;
  estimated_train_detention_minutes: number;
  status: string;
  optimizer_metadata?: Record<string, unknown>;
  jobs: ScheduledBlockJob[];
}

export interface OptimizerRunRequest {
  target_date: string;
  section_ids?: string[];
  horizon_days?: number;
  safety_buffer_minutes?: number;
  min_gap_minutes?: number;
  persist_to_db?: boolean;
}

export interface OptimizerRunResponse {
  run_id: string;
  target_date: string;
  solver_status: string;
  total_blocks_scheduled: number;
  total_maintenance_requests_covered: number;
  total_unassigned_requests: number;
  total_shadow_overlap_hours: number;
  total_train_detention_minutes: number;
  total_criticality_index: number;
  objective_value?: number;
  solver_execution_time_ms: number;
  scheduled_blocks: ScheduledBlock[];
  unassigned_request_ids: string[];
}

export interface ConflictingTrain {
  train_id: string;
  train_number: string;
  train_name: string;
  train_type: string;
  priority: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  expected_detention_minutes: number;
  detention_penalty_tier: number;
  is_hard_conflict: boolean;
}

export interface WhatIfSimulationRequest {
  simulation_name?: string;
  block_id?: string;
  section_id: string;
  target_date: string;
  start_time: string;
  end_time: string;
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
  conflicting_trains: ConflictingTrain[];
  risk_score_delta: number;
  criticality_index_preserved_pct: number;
  shadow_efficiency_score: number;
  slw_advisory_required: boolean;
  commit_token: string;
  expires_at: string;
}

export interface CommitSimulationResponse {
  success: boolean;
  message: string;
  block_id: string;
  block_code: string;
  committed_at: string;
}

export interface RiskPredictionRequest {
  request_code?: string;
  department?: string;
  activity_type?: string;
  priority?: string;
  scoring_mode?: string;
  tgi_deviation?: number;
  speed_restriction_kmh?: number;
  days_overdue?: number;
  section_gmt_density?: number;
  point_failure_risk?: number;
  ohe_insulator_wear?: number;
  usfd_flaw_severity?: number;
  usfd_classification?: string;
  metadata_json?: Record<string, unknown>;
}

export interface RiskPredictionResponse {
  request_code?: string;
  failure_probability: number;
  criticality_index: number;
  model_used: string;
  shap_explanation: {
    space: string;
    base_value: number;
    feature_attributions: Record<string, number>;
    human_readable_reasoning: string;
  };
  scoring_mode?: string;
  extracted_features?: Record<string, unknown>;
}

export interface ModelInfoResponse {
  model_name?: string;
  version?: string;
  status?: string;
  created_at?: string;
  metrics?: Record<string, number>;
  disclaimer?: string;
}

export interface Resource {
  id: string;
  name: string;
  department: string;
  quantity: number;
  is_available: boolean;
}

// ── Sections ──────────────────────────────────────────────

export async function fetchSections(pageSize = 100): Promise<Section[]> {
  const res = await apiFetch<PaginatedResponse<Section>>(`/sections?page=1&page_size=${pageSize}`);
  return res.items;
}

export async function fetchSectionById(id: string): Promise<Section> {
  return apiFetch<Section>(`/sections/${id}`);
}

export async function fetchSectionGapAnalysis(sectionId: string, targetDate: string) {
  return apiFetch(`/sections/${sectionId}/gap-analysis?target_date=${targetDate}`);
}

// ── Train Movements ───────────────────────────────────────

export async function fetchTrainMovements(sectionId?: string, dayOfWeek?: number): Promise<TrainMovement[]> {
  let query = '/train-movements?page=1&page_size=100';
  if (sectionId) query += `&section_id=${sectionId}`;
  if (dayOfWeek !== undefined) query += `&day_of_week=${dayOfWeek}`;
  const res = await apiFetch<PaginatedResponse<TrainMovement>>(query);
  return res.items;
}

export async function fetchTrains(pageSize = 100): Promise<Train[]> {
  const res = await apiFetch<PaginatedResponse<Train>>(`/trains?page=1&page_size=${pageSize}`);
  return res.items;
}

// ── Maintenance Requests ──────────────────────────────────

export async function fetchMaintenanceRequests(params?: {
  section_id?: string;
  department?: string;
  status?: string;
  priority?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<MaintenanceRequest>> {
  let query = '/maintenance?page=1&page_size=50';
  if (params?.section_id) query += `&section_id=${params.section_id}`;
  if (params?.department) query += `&department=${params.department}`;
  if (params?.status) query += `&status=${params.status}`;
  if (params?.priority) query += `&priority=${params.priority}`;
  if (params?.page) query += `&page=${params.page}`;
  if (params?.page_size) query += `&page_size=${params.page_size}`;
  return apiFetch<PaginatedResponse<MaintenanceRequest>>(query);
}

// ── Blocks ────────────────────────────────────────────────

export async function fetchBlocks(params?: {
  section_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Block>> {
  let query = '/blocks?page=1&page_size=50';
  if (params?.section_id) query += `&section_id=${params.section_id}`;
  if (params?.status) query += `&status=${params.status}`;
  if (params?.page) query += `&page=${params.page}`;
  if (params?.page_size) query += `&page_size=${params.page_size}`;
  return apiFetch<PaginatedResponse<Block>>(query);
}

export async function fetchBlockById(id: string): Promise<Block> {
  return apiFetch<Block>(`/blocks/${id}`);
}

export async function transitionBlock(id: string, payload: BlockTransitionRequest): Promise<Block> {
  return apiFetch<Block>(`/blocks/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function exportBlockBDMS(id: string) {
  return apiFetch(`/blocks/${id}/export-bdms`);
}

export async function exportBlockT351(id: string) {
  return apiFetch(`/blocks/${id}/t351-notice`);
}

export async function exportBlockTD602(id: string) {
  return apiFetch(`/blocks/${id}/td602-sheet`);
}

// ── Optimizer ─────────────────────────────────────────────

export async function runOptimizer(payload: OptimizerRunRequest): Promise<OptimizerRunResponse> {
  return apiFetch<OptimizerRunResponse>('/optimizer/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function simulateBlock(payload: WhatIfSimulationRequest): Promise<WhatIfSimulationResponse> {
  return apiFetch<WhatIfSimulationResponse>('/optimizer/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function commitSimulation(commitToken: string, approvedBy?: string, notes?: string): Promise<CommitSimulationResponse> {
  return apiFetch<CommitSimulationResponse>('/optimizer/commit-simulation', {
    method: 'POST',
    body: JSON.stringify({ commit_token: commitToken, approved_by: approvedBy, notes }),
  });
}

export async function rescheduleBlock(payload: {
  active_block_id: string;
  delay_minutes: number;
  reason?: string;
}) {
  return apiFetch('/optimizer/reschedule', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Risk Scoring ──────────────────────────────────────────

export async function predictRisk(payload: RiskPredictionRequest): Promise<RiskPredictionResponse> {
  return apiFetch<RiskPredictionResponse>('/risk/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  return apiFetch<ModelInfoResponse>('/risk/model-info');
}

// ── Resources ─────────────────────────────────────────────

export async function fetchResources(): Promise<Resource[]> {
  const res = await apiFetch<PaginatedResponse<Resource>>('/resources?page=1&page_size=100');
  return res.items;
}

// ── Ingestion ─────────────────────────────────────────────

export async function ingestTMS(payload: {
  section_id: string;
  usfd_classification?: string;
  tgi_deviation?: number;
  chainage_km?: number;
  curvature_deg?: number;
  duration_minutes?: number;
}) {
  return apiFetch('/ingest/tms', { method: 'POST', body: JSON.stringify(payload) });
}

export async function ingestSMMS(payload: {
  section_id: string;
  point_failure_risk?: number;
  station_code?: string;
  duration_minutes?: number;
}) {
  return apiFetch('/ingest/smms', { method: 'POST', body: JSON.stringify(payload) });
}

export async function ingestTDMS(payload: {
  section_id: string;
  ohe_wear_pct?: number;
  feeding_post?: string;
  duration_minutes?: number;
}) {
  return apiFetch('/ingest/tdms', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Health ────────────────────────────────────────────────

export async function fetchHealth() {
  return apiFetch('/health');
}
