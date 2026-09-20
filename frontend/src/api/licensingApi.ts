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

export interface PerpetualLicenseItem {
  id: string;
  licenseReference: string;
  productFamily: 'Windows' | 'Office' | 'WindowsServer' | 'Other';
  productName: string;
  productVersion?: string;
  edition?: string;
  licenseTerm: 'Perpetual' | 'Subscription' | 'Unknown';
  licenseChannel: 'KMS' | 'MAK' | 'ADBA' | 'Retail' | 'OEM' | 'Volume' | 'Unknown';
  activationType: 'KMS' | 'MAK' | 'ADBA' | 'Retail' | 'OEM' | 'Volume' | 'Unknown';
  agreementReference?: string;
  purchaseReference?: string;
  entitlementQuantity: number;
  assignedQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  effectiveDate?: string;
  purchaseDate?: string;
  expiryDate?: string;
  isActive: boolean;
  notes?: string;
  site?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface LicenseEntitlementItem {
  id: string;
  licenseId: string;
  productId?: string;
  productName: string;
  entitlementType: 'Perpetual' | 'Subscription' | 'Evaluation' | 'Trial' | 'Unknown';
  quantity: number;
  assignedQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  agreementReference?: string;
  effectiveDate?: string;
  expirationDate?: string;
  status: 'Active' | 'Suspended' | 'Expired' | 'Exhausted' | 'Cancelled' | 'Unknown';
  createdAt: string;
  updatedAt: string;
}

export interface LicensingProductItem {
  id: string;
  productId: string;
  productName: string;
  productFamily: 'Windows' | 'Office' | 'WindowsServer' | 'Other';
  version?: string;
  edition?: string;
  architecture?: string;
  supportedActivationTypes: string[];
  supportedLicenseTerms: string[];
  isVolumeProduct: boolean;
  isPerpetual: boolean;
  isActive: boolean;
}

export interface LicenseAssignmentItem {
  id: string;
  licenseId: string;
  licenseReference?: string;
  endpointId: string;
  endpointHostname?: string;
  endpointIpAddress?: string;
  productId?: string;
  productName?: string;
  assignmentStatus: 'Assigned' | 'Released' | 'Suspended' | 'Replaced';
  assignedAt: string;
  assignedBy?: string;
  releasedAt?: string;
  releasedBy?: string;
  notes?: string;
}

export interface LicenseComplianceAlertItem {
  id: string;
  licenseId: string;
  productName: string;
  complianceStatus: 'Compliant' | 'UnderAssigned' | 'FullyAssigned' | 'OverAssigned' | 'Unknown';
  entitlementCount: number;
  assignedCount: number;
  detectedCount: number;
  detectedAt: string;
  message: string;
  isResolved: boolean;
}

export interface PerpetualLicenseComplianceOverviewItem {
  totalEntitlements: number;
  assigned: number;
  available: number;
  reserved: number;
  unassigned: number;
  complianceExceptions: number;
  licenses: PerpetualLicenseItem[];
  alerts: LicenseComplianceAlertItem[];
}

export interface LicenseMatrixRowItem {
  licenseTerm: string;
  channel: string;
  activation: string;
  managed: string;
  isKmsSupported: boolean;
  isMakSupported: boolean;
  isAdbaSupported: boolean;
  notes: string;
}

export const licensingApi = {
  getOverview: async () => {
    const res = await apiClient.get<LicensingOverview>('/api/licensing/overview');
    return res.data;
  },

  getKmsHosts: async () => {
    const res = await apiClient.get<KmsHostItem[]>('/api/licensing/kms-hosts');
    return res.data;
  },

  createKmsHost: async (data: Partial<KmsHostItem>) => {
    const res = await apiClient.post<KmsHostItem>('/api/licensing/kms-hosts', data);
    return res.data;
  },

  updateKmsHost: async (id: string, data: Partial<KmsHostItem>) => {
    const res = await apiClient.put<KmsHostItem>(`/api/licensing/kms-hosts/${id}`, data);
    return res.data;
  },

  deleteKmsHost: async (id: string) => {
    await apiClient.delete(`/api/licensing/kms-hosts/${id}`);
  },

  checkHostHealth: async (id: string) => {
    const res = await apiClient.post(`/api/licensing/kms-hosts/${id}/health-check`);
    return res.data;
  },

  getEndpointActivation: async (endpointId: string) => {
    const res = await apiClient.get<{ windows: ActivationRecordItem | null; office: ActivationRecordItem | null }>(
      `/api/licensing/endpoints/${endpointId}`
    );
    return res.data;
  },

  triggerActivationCheck: async (endpointId: string) => {
    const res = await apiClient.post(`/api/licensing/endpoints/${endpointId}/activation-check`);
    return res.data;
  },

  configureKmsClient: async (endpointId: string, kmsHostname: string, port: number = 1688) => {
    const res = await apiClient.post(`/api/licensing/endpoints/${endpointId}/configure-kms`, {
      endpointId,
      kmsHostname,
      port,
    });
    return res.data;
  },

  activateEndpoint: async (endpointId: string) => {
    const res = await apiClient.post(`/api/licensing/endpoints/${endpointId}/activate`);
    return res.data;
  },

  getWaves: async () => {
    const res = await apiClient.get<ActivationWaveItem[]>('/api/licensing/waves');
    return res.data;
  },

  createWave: async (name: string, waveSize: number = 25) => {
    const res = await apiClient.post<ActivationWaveItem>('/api/licensing/waves', { name, waveSize });
    return res.data;
  },

  startWave: async (id: string) => {
    const res = await apiClient.post(`/api/licensing/waves/${id}/start`);
    return res.data;
  },

  pauseWave: async (id: string) => {
    const res = await apiClient.post(`/api/licensing/waves/${id}/pause`);
    return res.data;
  },

  getOfflineHistory: async () => {
    const res = await apiClient.get<OfflinePackageItem[]>('/api/licensing/offline/history');
    return res.data;
  },

  exportPackage: async (targetEnvironment: string, description?: string) => {
    const res = await apiClient.post('/api/licensing/offline/export', { targetEnvironment, description }, { responseType: 'blob' });
    return res.data;
  },

  validatePackage: async (packageJsonContent: string) => {
    const res = await apiClient.post('/api/licensing/offline/validate', { packageJsonContent });
    return res.data;
  },

  importPackage: async (packageJsonContent: string) => {
    const res = await apiClient.post('/api/licensing/offline/import', { packageJsonContent });
    return res.data;
  },

  // Perpetual Licensing API
  getPerpetualLicenses: async (product?: string, channel?: string, search?: string) => {
    const res = await apiClient.get<PerpetualLicenseItem[]>('/api/licensing/licenses', {
      params: { product, channel, search },
    });
    return res.data;
  },

  getPerpetualLicenseById: async (id: string) => {
    const res = await apiClient.get<PerpetualLicenseItem>(`/api/licensing/licenses/${id}`);
    return res.data;
  },

  createPerpetualLicense: async (data: Partial<PerpetualLicenseItem>) => {
    const res = await apiClient.post<PerpetualLicenseItem>('/api/licensing/licenses', data);
    return res.data;
  },

  updatePerpetualLicense: async (id: string, data: Partial<PerpetualLicenseItem>) => {
    const res = await apiClient.put<PerpetualLicenseItem>(`/api/licensing/licenses/${id}`, data);
    return res.data;
  },

  deletePerpetualLicense: async (id: string) => {
    await apiClient.delete(`/api/licensing/licenses/${id}`);
  },

  getAssignments: async (licenseId?: string) => {
    const res = await apiClient.get<LicenseAssignmentItem[]>(`/api/licensing/licenses/${licenseId || 'all'}/assignments`);
    return res.data;
  },

  assignLicense: async (licenseId: string, endpointId: string, notes?: string) => {
    const res = await apiClient.post<LicenseAssignmentItem>(`/api/licensing/licenses/${licenseId}/assign`, {
      licenseId,
      endpointId,
      notes,
    });
    return res.data;
  },

  releaseLicense: async (assignmentId: string, notes?: string) => {
    const res = await apiClient.post(`/api/licensing/licenses/${assignmentId}/release`, {
      assignmentId,
      notes,
    });
    return res.data;
  },

  transferLicense: async (assignmentId: string, targetEndpointId: string, notes?: string) => {
    const res = await apiClient.post<LicenseAssignmentItem>(`/api/licensing/licenses/${assignmentId}/transfer`, {
      assignmentId,
      targetEndpointId,
      notes,
    });
    return res.data;
  },

  getCompliance: async () => {
    const res = await apiClient.get<PerpetualLicenseComplianceOverviewItem>('/api/licensing/compliance');
    return res.data;
  },

  runComplianceCheck: async () => {
    const res = await apiClient.post('/api/licensing/compliance/run');
    return res.data;
  },

  getProducts: async () => {
    const res = await apiClient.get<LicensingProductItem[]>('/api/licensing/products');
    return res.data;
  },

  getEntitlements: async () => {
    const res = await apiClient.get<LicenseEntitlementItem[]>('/api/licensing/entitlements');
    return res.data;
  },

  getMatrix: async () => {
    const res = await apiClient.get<LicenseMatrixRowItem[]>('/api/licensing/matrix');
    return res.data;
  },

  downloadPerpetualReportCsv: async () => {
    const res = await apiClient.get('/api/licensing/reports/perpetual', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Perpetual_License_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
