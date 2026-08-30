import { apiClient } from './client';
import { Section, Train, TrainMovement, PaginatedResponse } from '../types/section';

export const sectionsApi = {
  getSections: async (page = 1, pageSize = 50, zone?: string, division?: string): Promise<PaginatedResponse<Section>> => {
    const params: Record<string, any> = { page, page_size: pageSize };
    if (zone) params.zone = zone;
    if (division) params.division = division;
    const response = await apiClient.get<PaginatedResponse<Section>>('/sections', { params });
    return response.data;
  },

  getSection: async (sectionId: string): Promise<Section> => {
    const response = await apiClient.get<Section>(`/sections/${sectionId}`);
    return response.data;
  },

  getTrainMovements: async (sectionId?: string, dayOfWeek?: number, page = 1, pageSize = 100): Promise<PaginatedResponse<TrainMovement>> => {
    const params: Record<string, any> = { page, page_size: pageSize };
    if (sectionId) params.section_id = sectionId;
    if (dayOfWeek !== undefined) params.day_of_week = dayOfWeek;
    const response = await apiClient.get<PaginatedResponse<TrainMovement>>('/train-movements', { params });
    return response.data;
  },

  getTrains: async (page = 1, pageSize = 100): Promise<PaginatedResponse<Train>> => {
    const response = await apiClient.get<PaginatedResponse<Train>>('/trains', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
};
