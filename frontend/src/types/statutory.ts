import { Department } from './block';

export interface FormT351NoticePayload {
  form_type: string;
  notice_number: string;
  station_code: string;
  section_code: string;
  date: string;
  disconnection_time: string;
  line_affected: string;
  work_nature: string;
  department: Department;
  disconnection_private_number: string;
  station_master_name: string;
  field_engineer_name: string;
  field_engineer_designation: string;
  reconnection_private_number?: string | null;
  reconnection_time?: string | null;
  tsr_imposed: boolean;
  tsr_speed_kmph?: number | null;
  remarks?: string | null;
  status: string;
}

export interface FormTD602CautionOrder {
  pilot_train_speed: string;
  facing_points_speed: string;
  subsequent_train_speed: string;
  clamping_padlocking_mandate: string;
}

export interface FormTD602SheetPayload {
  form_name: string;
  form_title: string;
  statutory_rule: string;
  division: string;
  zone: string;
  section_code: string;
  section_name: string;
  date_time: string;
  line_obstructed: string;
  line_in_use: string;
  pilot_train_number: string;
  station_master_private_number: string;
  part_1_line_clear_ticket: string;
  part_2_authority_to_pass_signals_at_on: string;
  part_3_caution_order: FormTD602CautionOrder;
  controller_phone_script: string;
}

export interface BDMSShadowActivity {
  request_code: string;
  department: Department;
  activity_type: string;
  start_offset_minutes: number;
  duration_minutes: number;
  criticality_index: number;
  resources_required: string[];
}

export interface BDMSExportPayload {
  bdms_message_id: string;
  message_version: string;
  timestamp: string;
  division: string;
  zone: string;
  section_code: string;
  section_name: string;
  block_code: string;
  block_type: string;
  line_direction: string;
  block_date: string;
  granted_start_time: string;
  granted_end_time: string;
  total_duration_minutes: number;
  primary_department: Department;
  participating_departments: Department[];
  traction_power_isolation: boolean;
  feeding_post_section?: string | null;
  tsr_imposed: boolean;
  tsr_speed_kmph?: number | null;
  demanding_official?: string | null;
  authorizing_controller?: string | null;
  primary_activity: string;
  shadow_activities: BDMSShadowActivity[];
  status: string;
}
