import { apiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  UserDto,
  ChangePasswordRequest,
  CreateUserRequest,
  ApiResponse,
} from '../types/api';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/Auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>('/api/Auth/me');
    return response.data;
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/api/Auth/change-password', payload);
    return response.data;
  },

  getUsers: async (): Promise<UserDto[]> => {
    const response = await apiClient.get<UserDto[]>('/api/Auth/users');
    return response.data;
  },

  createUser: async (payload: CreateUserRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/api/Auth/users', payload);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/api/Auth/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id: string, role: string): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(`/api/Auth/users/${id}/role`, JSON.stringify(role), {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  deactivateUser: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(`/api/Auth/users/${id}/deactivate`);
    return response.data;
  },
};
