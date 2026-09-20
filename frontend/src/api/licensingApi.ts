import { apiClient } from './client';

export interface KmsHostItem {
  id: string;
  name: string;
  hostname: string;
  ipAddress?: string;
  fqdn?: string;
  port: number;
  operatingSystem?: string;
  serverVersion?: string;
  environment?: string;
  site?: string;
  description?: string;
  status: 'Unknown' | 'Online' | 'Offline' | 'Warning' | 'Misconfigured';
  lastHealthCheck?: string;
  lastSuccessfulActivationCheck?: string;
  responseLatencyMs: number;
  lastErrorMessage?: string;
  activeEndpointsCount: number;
  createdAt: string;
}

export interface ActivationRecordItem {
  id: string;
  endpointId: string;
  endpointHostname: string;
  productFamily: 'Windows' | 'Office' | 'WindowsServer' | 'Other';
  productName: string;
  productVersion?: string;
  edition?: string;
  channel?: string;
  activationType: 'KMS' | 'MAK' | 'ADBA' | 'Unknown';
  activationStatus: 'Unknown' | 'Activated' | 'NotActivated' | 'GracePeriod' | 'Notification' | 'Failed' | 'Unlicensed';
  partialProductKey?: string;
  kmsHostId?: string;
  kmsHostName?: string;
  kmsHostAddress?: string;
  lastCheckedAt?: string;
  activationExpiry?: string;
  failureReason?: string;
}

export interface ActivationWaveItem {
  id: string;
  name: string;
  status: 'Created' | 'Running' | 'Paused' | 'Completed' | 'Cancelled';
  waveSize: number;
  targetProductFamily: 'Windows' | 'Office';
  kmsHostId?: string;
  kmsHostName?: string;
  totalEndpoints: number;
  activatedCount: number;
  failedCount: number;
  skippedCount: number;
  createdBy?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  items: {
    id: string;
    endpointId: string;
    endpointHostname: string;
    status: string;
    waveNumber: number;
    resultLog?: string;
    errorMessage?: string;
    processedAt?: string;
  }[];
}

export interface OfflinePackageItem {
  id: string;
  packageId: string;
  version: string;
  createdBy: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  schemaVersion: string;
  packageHash: string;
  signature: string;
  status: 'Exported' | 'Verified' | 'Imported' | 'Rejected';
  description?: string;
  recordCount: number;
  createdAt: string;
  expirationDate?: string;
  importedAt?: string;
  importedBy?: string;
}

export interface LicensingOverview {
  kmsHostsTotal: number;
  kmsHostsHealthy: number;
  kmsHostsWarning: number;
  kmsHostsOffline: number;
  windowsActivated: number;
  windowsNotActivated: number;
  windowsGracePeriod: number;
  windowsFailed: number;
  officeActivated: number;
  officeNotActivated: number;
  officeGracePeriod: number;
  officeFailed: number;
  totalEndpointsNeedingAttention: number;
  compliancePercentage: number;
  topKmsHosts: KmsHostItem[];
  recentActivationFailures: ActivationRecordItem[];
}

export const licensingApi = {
  getOverview: async () => {
    const res = await apiClient.get<LicensingOverview>('/licensing/overview');
    return res.data;
  },

  getKmsHosts: async () => {
    const res = await apiClient.get<KmsHostItem[]>('/licensing/kms-hosts');
    return res.data;
  },

  createKmsHost: async (data: Partial<KmsHostItem>) => {
    const res = await apiClient.post<KmsHostItem>('/licensing/kms-hosts', data);
    return res.data;
  },

  updateKmsHost: async (id: string, data: Partial<KmsHostItem>) => {
    const res = await apiClient.put<KmsHostItem>(`/licensing/kms-hosts/${id}`, data);
    return res.data;
  },

  deleteKmsHost: async (id: string) => {
    await apiClient.delete(`/licensing/kms-hosts/${id}`);
  },

  checkHostHealth: async (id: string) => {
    const res = await apiClient.post(`/licensing/kms-hosts/${id}/health-check`);
    return res.data;
  },

  getEndpointActivation: async (endpointId: string) => {
    const res = await apiClient.get<{ windows: ActivationRecordItem | null; office: ActivationRecordItem | null }>(
      `/licensing/endpoints/${endpointId}`
    );
    return res.data;
  },

  triggerActivationCheck: async (endpointId: string) => {
    const res = await apiClient.post(`/licensing/endpoints/${endpointId}/activation-check`);
    return res.data;
  },

  configureKmsClient: async (endpointId: string, kmsHostname: string, port: number = 1688) => {
    const res = await apiClient.post(`/licensing/endpoints/${endpointId}/configure-kms`, {
      endpointId,
      kmsHostname,
      port,
    });
    return res.data;
  },

  activateEndpoint: async (endpointId: string) => {
    const res = await apiClient.post(`/licensing/endpoints/${endpointId}/activate`);
    return res.data;
  },

  getWaves: async () => {
    const res = await apiClient.get<ActivationWaveItem[]>('/licensing/waves');
    return res.data;
  },

  createWave: async (name: string, waveSize: number = 25) => {
    const res = await apiClient.post<ActivationWaveItem>('/licensing/waves', { name, waveSize });
    return res.data;
  },

  startWave: async (id: string) => {
    const res = await apiClient.post(`/licensing/waves/${id}/start`);
    return res.data;
  },

  pauseWave: async (id: string) => {
    const res = await apiClient.post(`/licensing/waves/${id}/pause`);
    return res.data;
  },

  getOfflineHistory: async () => {
    const res = await apiClient.get<OfflinePackageItem[]>('/licensing/offline/history');
    return res.data;
  },

  exportPackage: async (targetEnvironment: string, description?: string) => {
    const res = await apiClient.post('/licensing/offline/export', { targetEnvironment, description }, { responseType: 'blob' });
    return res.data;
  },

  validatePackage: async (packageJsonContent: string) => {
    const res = await apiClient.post('/licensing/offline/validate', { packageJsonContent });
    return res.data;
  },

  importPackage: async (packageJsonContent: string) => {
    const res = await apiClient.post('/licensing/offline/import', { packageJsonContent });
    return res.data;
  },
};
