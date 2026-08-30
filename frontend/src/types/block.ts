export type Department = 'TRACK' | 'SIGNAL' | 'TRACTION';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MaintenanceStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type BlockStatus = 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface MaintenanceRequest {
  id: string;
  request_code: string;
  section_id: string;
  department: Department;
  activity_type: string;
  duration_minutes: number;
  priority: Priority;
  deadline: string;
  status: MaintenanceStatus;
  resource_id?: string | null;
  metadata_json?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface BlockJob {
  id: string;
  block_id: string;
  maintenance_request_id: string;
  is_primary: boolean;
  start_offset_minutes: number;
  end_offset_minutes: number;
  maintenance_request?: MaintenanceRequest;
}

export interface Block {
  id: string;
  block_code: string;
  section_id: string;
  block_date: string;
  start_time: string; // "HH:MM:SS"
  end_time: string;   // "HH:MM:SS"
  status: BlockStatus;
  is_joint_shadow_block: boolean;
  shadow_overlap_hours: number;
  total_criticality_index: number;
  estimated_train_detention_minutes: number;
  optimizer_metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  block_jobs?: BlockJob[];
}

export interface BlockTransitionRequest {
  target_status: BlockStatus;
  private_number?: string | null;
  station_master_name?: string | null;
  reconnection_pn?: string | null;
  tsr_speed_kmph?: number | null;
  notes?: string | null;
}
