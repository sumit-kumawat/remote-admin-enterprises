import { apiClient } from './client';

export interface DiscoveredEndpointItem {
  id: string;
  scanId: string;
  hostname: string;
  ipAddress: string;
  macAddress?: string;
  osName?: string;
  isWindows: boolean;
  discoveryMethod: string;
  status: string;
  discoveredAt: string;
}

export const fetchDiscoveredEndpoints = async (): Promise<DiscoveredEndpointItem[]> => {
  const response = await apiClient.get<DiscoveredEndpointItem[]>('/api/Discovery/results');
  return response.data;
};

export const startDiscoveryScan = async (cidr: string): Promise<DiscoveredEndpointItem[]> => {
  const response = await apiClient.post('/api/Discovery/scan', { cidr });
  return response.data.data;
};

export const importDiscoveredEndpoints = async (discoveredIds: string[]) => {
  const response = await apiClient.post('/api/Discovery/import', { discoveredIds });
  return response.data;
};
