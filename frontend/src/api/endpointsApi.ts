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

  deleteEndpoint: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/api/Endpoints/${id}`);
    return response.data;
  },

  bulkDelete: async (endpointIds: string[]): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/api/Endpoints/bulk-delete', { action: 'Delete', endpointIds });
    return response.data;
  },

  createLocalAdmin: async (endpointIds: string[]): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/api/Endpoints/create-local-admin', { endpointIds });
    return response.data;
  },

  resetUserPassword: async (endpointId: string, targetUsername: string, newPassword: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/api/Endpoints/${endpointId}/users/reset-password`, { targetUsername, newPassword });
    return response.data;
  },

  updateUserGroups: async (endpointId: string, targetUsername: string, groups: string[]): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/api/Endpoints/${endpointId}/users/update-groups`, { targetUsername, groups });
    return response.data;
  },

  installSoftware: async (endpointId: string, packageName: string, version?: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/api/Endpoints/${endpointId}/software/install`, { packageName, version });
    return response.data;
  },

  uninstallSoftware: async (endpointId: string, softwareName: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/api/Endpoints/${endpointId}/software/uninstall`, { softwareName });
    return response.data;
  },

  powerControl: async (endpointId: string, action: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/api/Endpoints/${endpointId}/power`, { action });
    return response.data;
  },

  updateCredential: async (endpointId: string, authMode: string, credentialProfileId?: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/api/Endpoints/${endpointId}/credential`, { authMode, credentialProfileId });
    return response.data;
  },

  checkConnection: async (endpointId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/api/Endpoints/${endpointId}/check-connection`);
    return response.data;
  },

  createLocalAccount: async (endpointId: string, payload: { username: string; password: string; fullName?: string; description?: string; isAdmin: boolean }): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/api/Endpoints/${endpointId}/local-accounts/create`, payload);
    return response.data;
  },
};
