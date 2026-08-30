export type LineType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUADRUPLE';
export type TrainType = 'EXPRESS' | 'SUPERFAST' | 'MAIL' | 'LOCAL' | 'FREIGHT';
export type TrainPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Section {
  id: string;
  section_code: string;
  section_name: string;
  division: string;
  zone: string;
  length_km: number;
  line_type: LineType;
  created_at: string;
  updated_at: string;
}

export interface Train {
  id: string;
  train_number: string;
  train_name: string;
  train_type: TrainType;
  priority: TrainPriority;
  created_at: string;
  updated_at: string;
}

export interface TrainMovement {
  id: string;
  train_id: string;
  section_id: string;
  departure_time: string; // "HH:MM:SS"
  arrival_time: string;   // "HH:MM:SS"
  day_of_week: number;    // 0=Monday, 6=Sunday
  movement_type: 'SCHEDULED' | 'FORECAST_FREIGHT';
  is_active: boolean;
  train?: Train;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
