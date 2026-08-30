import { apiClient } from './client';

export interface IngestTMSPayload {
  section_id: string;
  usfd_classification?: string;
  usfd_flaw_severity?: number;
  tgi_deviation: number;
  chainage_km: number;
  curvature_deg: number;
  duration_minutes: number;
}

export interface IngestSMMSPayload {
  section_id: string;
  point_failure_risk: number;
  station_code: string;
  duration_minutes: number;
}

export interface IngestTDMSPayload {
  section_id: string;
  ohe_wear_pct: number;
  feeding_post: string;
  duration_minutes: number;
}

export const ingestionApi = {
  ingestTMS: async (payload: IngestTMSPayload) => {
    const response = await apiClient.post('/ingest/tms', payload);
    return response.data;
  },

  ingestSMMS: async (payload: IngestSMMSPayload) => {
    const response = await apiClient.post('/ingest/smms', payload);
    return response.data;
  },

  ingestTDMS: async (payload: IngestTDMSPayload) => {
    const response = await apiClient.post('/ingest/tdms', payload);
    return response.data;
  },
};
