import { apiClient } from './client';

export interface DeploymentJobItem {
  id: string;
  endpointId: string;
  packageName: string;
  packageVersion: string;
  status: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  endpoint?: {
    hostname: string;
    ipAddress?: string;
  };
}

export const fetchDeploymentJobs = async (): Promise<DeploymentJobItem[]> => {
  const response = await apiClient.get<DeploymentJobItem[]>('/api/Deployments');
  return response.data;
};

export const createDeploymentJob = async (data: {
  packageId: string;
  endpointIds: string[];
  waveSize?: number;
  timeoutSeconds?: number;
  credentialProfileId?: string;
}) => {
  const response = await apiClient.post('/api/Deployments', data);
  return response.data;
};
