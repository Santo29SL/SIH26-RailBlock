import { apiClient } from './client';
import { Block, BlockStatus, BlockTransitionRequest, MaintenanceRequest } from '../types/block';
import { PaginatedResponse } from '../types/section';
import { FormT351NoticePayload, FormTD602SheetPayload, BDMSExportPayload } from '../types/statutory';

export const blocksApi = {
  getBlocks: async (sectionId?: string, status?: BlockStatus, page = 1, pageSize = 50): Promise<PaginatedResponse<Block>> => {
    const params: Record<string, any> = { page, page_size: pageSize };
    if (sectionId) params.section_id = sectionId;
    if (status) params.status = status;
    const response = await apiClient.get<PaginatedResponse<Block>>('/blocks', { params });
    return response.data;
  },

  getBlock: async (blockId: string): Promise<Block> => {
    const response = await apiClient.get<Block>(`/blocks/${blockId}`);
    return response.data;
  },

  transitionBlock: async (blockId: string, payload: BlockTransitionRequest): Promise<Block> => {
    const response = await apiClient.post<Block>(`/blocks/${blockId}/transition`, payload);
    return response.data;
  },

  exportBDMS: async (blockId: string): Promise<BDMSExportPayload> => {
    const response = await apiClient.get<BDMSExportPayload>(`/blocks/${blockId}/export-bdms`);
    return response.data;
  },

  exportT351Notice: async (blockId: string): Promise<FormT351NoticePayload> => {
    const response = await apiClient.get<FormT351NoticePayload>(`/blocks/${blockId}/t351-notice`);
    return response.data;
  },

  exportTD602Sheet: async (blockId: string): Promise<FormTD602SheetPayload> => {
    const response = await apiClient.get<FormTD602SheetPayload>(`/blocks/${blockId}/td602-sheet`);
    return response.data;
  },

  getMaintenanceRequests: async (sectionId?: string, department?: string, status?: string, page = 1, pageSize = 50): Promise<PaginatedResponse<MaintenanceRequest>> => {
    const params: Record<string, any> = { page, page_size: pageSize };
    if (sectionId) params.section_id = sectionId;
    if (department) params.department = department;
    if (status) params.status = status;
    const response = await apiClient.get<PaginatedResponse<MaintenanceRequest>>('/maintenance', { params });
    return response.data;
  },
};
