export type USFDClassification = 'GOOD' | 'OBS' | 'OBSW' | 'IMR' | 'IMRW';

export interface DefectMetadata {
  tgi_deviation?: number;
  speed_restriction_kmh?: number;
  days_overdue?: number;
  section_gmt_density?: number;
  usfd_classification?: USFDClassification;
  usfd_flaw_severity?: number;
  point_failure_risk?: number;
  ohe_insulator_wear?: number;
  chainage_km?: number;
  curvature_deg?: number;
  feeding_post?: string;
  station_code?: string;
}

export interface ShapExplanation {
  space: string;
  base_value: number;
  feature_attributions: Record<string, number>;
  human_readable_reasoning: string;
}

export interface RiskPredictionRequest {
  request_code?: string;
  department: string;
  activity_type?: string;
  metadata: DefectMetadata;
}

export interface RiskPredictionResponse {
  request_code?: string;
  failure_probability: number;
  criticality_index: number;
  model_used: string;
  shap_explanation: ShapExplanation;
}

export interface ModelInfoResponse {
  model_name: string;
  version: string;
  status: string;
  created_at: string;
  seed: number;
  library_versions: Record<string, string>;
  feature_order: string[];
  bounds: Record<string, [number, number]>;
}
