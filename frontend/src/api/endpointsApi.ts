import { apiClient } from './client';
import type {
  EndpointDto,
  EndpointDetailDto,
  CreateEndpointRequest,
  PagedResponse,
  ApiResponse,
} from '../types/api';

export const endpointsApi = {
  getAll: async (params?: { search?: string; page?: number; pageSize?: number }): Promise<PagedResponse<EndpointDto>> => {
    const response = await apiClient.get<PagedResponse<EndpointDto>>('/api/Endpoints', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<EndpointDetailDto>> => {
    const response = await apiClient.get<ApiResponse<EndpointDetailDto>>(`/api/Endpoints/${id}`);
    return response.data;
  },

  create: async (payload: CreateEndpointRequest): Promise<ApiResponse<EndpointDto>> => {
    const response = await apiClient.post<ApiResponse<EndpointDto>>('/api/Endpoints', payload);
    return response.data;
  },
};
