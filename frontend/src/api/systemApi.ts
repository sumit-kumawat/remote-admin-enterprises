import { apiClient } from './client';
import type { SystemInfoDto } from '../types/api';

export const systemApi = {
  getInfo: async (): Promise<SystemInfoDto> => {
    const response = await apiClient.get<SystemInfoDto>('/api/System/info');
    return response.data;
  },
};
