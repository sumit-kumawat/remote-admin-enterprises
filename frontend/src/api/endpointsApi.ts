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

  importFile: async (formData: FormData): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/api/Endpoints/import-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  bulkAction: async (action: string, endpointIds: string[]): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/api/Endpoints/bulk-action', { action, endpointIds });
    return response.data;
  },

  createLocalAdmin: async (endpointIds: string[]): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/api/Endpoints/create-local-admin', { endpointIds });
    return response.data;
  },
};
