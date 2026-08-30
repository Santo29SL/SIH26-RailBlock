import { apiClient } from './client';
import { RiskPredictionRequest, RiskPredictionResponse, ModelInfoResponse } from '../types/risk';

export const riskApi = {
  predictRisk: async (payload: RiskPredictionRequest): Promise<RiskPredictionResponse> => {
    const response = await apiClient.post<RiskPredictionResponse>('/risk/predict', payload);
    return response.data;
  },

  getModelInfo: async (): Promise<ModelInfoResponse> => {
    const response = await apiClient.get<ModelInfoResponse>('/risk/model-info');
    return response.data;
  },
};
