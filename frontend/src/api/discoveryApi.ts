import { apiClient } from './client';
import type {
  DiscoveryScanDto,
  DiscoveryHostDto,
  DiscoveryScheduleDto,
  NetworkInterfaceDto,
  CreateScanRequest,
  CreateScheduleRequest,
  PromoteHostResult,
} from '../types/discovery';

export const discoveryApi = {
  // Scans
  getScans: async (): Promise<DiscoveryScanDto[]> => {
    const response = await apiClient.get<DiscoveryScanDto[]>('/api/Discovery/scans');
    return response.data;
  },

  getScan: async (id: string): Promise<DiscoveryScanDto> => {
    const response = await apiClient.get<DiscoveryScanDto>(`/api/Discovery/scans/${id}`);
    return response.data;
  },

  getScanHosts: async (id: string): Promise<DiscoveryHostDto[]> => {
    const response = await apiClient.get<DiscoveryHostDto[]>(`/api/Discovery/scans/${id}/hosts`);
    return response.data;
  },

  createScan: async (request: CreateScanRequest): Promise<DiscoveryScanDto> => {
    const response = await apiClient.post<DiscoveryScanDto>('/api/Discovery/scans', request);
    return response.data;
  },

  pauseScan: async (id: string): Promise<void> => {
    await apiClient.post(`/api/Discovery/scans/${id}/pause`);
  },

  resumeScan: async (id: string): Promise<void> => {
    await apiClient.post(`/api/Discovery/scans/${id}/resume`);
  },

  cancelScan: async (id: string): Promise<void> => {
    await apiClient.post(`/api/Discovery/scans/${id}/cancel`);
  },

  promoteHost: async (hostId: string): Promise<PromoteHostResult> => {
    const response = await apiClient.post<PromoteHostResult>(`/api/Discovery/hosts/${hostId}/promote`);
    return response.data;
  },

  exportScanUrl: (id: string, format: 'csv' | 'json' = 'csv'): string => {
    return `/api/Discovery/scans/${id}/export?format=${format}`;
  },

  exportScan: async (id: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    const response = await apiClient.get(`/api/Discovery/scans/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Schedules
  getSchedules: async (): Promise<DiscoveryScheduleDto[]> => {
    const response = await apiClient.get<DiscoveryScheduleDto[]>('/api/Discovery/schedules');
    return response.data;
  },

  createSchedule: async (request: CreateScheduleRequest): Promise<DiscoveryScheduleDto> => {
    const response = await apiClient.post<DiscoveryScheduleDto>('/api/Discovery/schedules', request);
    return response.data;
  },

  updateSchedule: async (id: string, request: CreateScheduleRequest): Promise<DiscoveryScheduleDto> => {
    const response = await apiClient.put<DiscoveryScheduleDto>(`/api/Discovery/schedules/${id}`, request);
    return response.data;
  },

  deleteSchedule: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/Discovery/schedules/${id}`);
  },

  // Subnets / Local Interfaces
  getSubnets: async (): Promise<NetworkInterfaceDto[]> => {
    const response = await apiClient.get<NetworkInterfaceDto[]>('/api/Discovery/subnets');
    return response.data;
  },
};
