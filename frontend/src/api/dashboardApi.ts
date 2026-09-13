import { apiClient } from './client';
import type { DashboardStatsDto } from '../types/api';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStatsDto> => {
    const response = await apiClient.get<DashboardStatsDto>('/api/Dashboard/stats');
    return response.data;
  },
};
