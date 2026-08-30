import { apiClient } from './client';
import {
  OptimizerRunRequest,
  OptimizerRunResponse,
  WhatIfSimulationRequest,
  WhatIfSimulationResponse,
  CommitSimulationRequest,
  CommitSimulationResponse,
  RescheduleRequest,
  RescheduleResponse,
} from '../types/optimizer';

export const optimizerApi = {
  runOptimizer: async (payload: OptimizerRunRequest, horizonDays?: number): Promise<OptimizerRunResponse> => {
    const params = horizonDays ? { horizon_days: horizonDays } : undefined;
    const response = await apiClient.post<OptimizerRunResponse>('/optimizer/run', payload, { params });
    return response.data;
  },

  simulateWhatIf: async (payload: WhatIfSimulationRequest): Promise<WhatIfSimulationResponse> => {
    const response = await apiClient.post<WhatIfSimulationResponse>('/optimizer/simulate', payload);
    return response.data;
  },

  commitSimulation: async (payload: CommitSimulationRequest): Promise<CommitSimulationResponse> => {
    const response = await apiClient.post<CommitSimulationResponse>('/optimizer/commit-simulation', payload);
    return response.data;
  },

  reschedule: async (payload: RescheduleRequest): Promise<RescheduleResponse> => {
    const response = await apiClient.post<RescheduleResponse>('/optimizer/reschedule', payload);
    return response.data;
  },
};
