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
    const response = await apiClient.get('/api/Discovery/scans');
    const resData: any = response.data;
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData?.items)) return resData.items;
    if (Array.isArray(resData?.data)) return resData.data;
    return [];
  },

  getScan: async (id: string): Promise<DiscoveryScanDto> => {
    const response = await apiClient.get(`/api/Discovery/scans/${id}`);
    const resData: any = response.data;
    return resData?.data ?? resData;
  },

  getScanHosts: async (id: string): Promise<DiscoveryHostDto[]> => {
    const response = await apiClient.get(`/api/Discovery/scans/${id}/hosts`);
    const resData: any = response.data;
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData?.items)) return resData.items;
    if (Array.isArray(resData?.data)) return resData.data;
    return [];
  },

  createScan: async (request: CreateScanRequest): Promise<DiscoveryScanDto> => {
    const response = await apiClient.post('/api/Discovery/scans', request);
    const resData: any = response.data;
    return resData?.data ?? resData;
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
    const resData: any = response.data;
    return resData?.data ?? resData;
  },

  bulkPromoteHosts: async (hostIds: string[]): Promise<PromoteHostResult[]> => {
    return await Promise.all(hostIds.map((id) => discoveryApi.promoteHost(id)));
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
    const response = await apiClient.get('/api/Discovery/schedules');
    const resData: any = response.data;
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData?.items)) return resData.items;
    if (Array.isArray(resData?.data)) return resData.data;
    return [];
  },

  createSchedule: async (request: CreateScheduleRequest): Promise<DiscoveryScheduleDto> => {
    const response = await apiClient.post('/api/Discovery/schedules', request);
    const resData: any = response.data;
    return resData?.data ?? resData;
  },

  updateSchedule: async (id: string, request: CreateScheduleRequest): Promise<DiscoveryScheduleDto> => {
    const response = await apiClient.put(`/api/Discovery/schedules/${id}`, request);
    const resData: any = response.data;
    return resData?.data ?? resData;
  },

  deleteSchedule: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/Discovery/schedules/${id}`);
  },

  // Subnets / Local Interfaces
  getSubnets: async (): Promise<NetworkInterfaceDto[]> => {
    const response = await apiClient.get('/api/Discovery/subnets');
    const resData: any = response.data;
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData?.items)) return resData.items;
    if (Array.isArray(resData?.data)) return resData.data;
    return [];
  },
};
