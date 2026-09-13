// TypeScript models for isolated mock modules (Deployments, Discovery, Audit, Settings)

export interface SoftwarePackage {
  id: string;
  name: string;
  version: string;
  publisher: string;
  architecture: 'x64' | 'x86' | 'ARM64';
  sizeMb: number;
  installerType: 'MSI' | 'EXE' | 'PS1';
  status: 'Ready' | 'Deprecated';
  createdAt: string;
}

export interface DeploymentJobMock {
  id: string;
  packageName: string;
  packageVersion: string;
  targetCount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  runningCount: number;
  status: 'Queued' | 'Running' | 'Completed' | 'FailedWithErrors';
  waveSize: number;
  timeoutMinutes: number;
  maxRetries: number;
  scheduledAt: string;
  createdBy: string;
}

export interface DeploymentEndpointStatusMock {
  endpointId: string;
  hostname: string;
  ipAddress: string;
  status: 'Completed' | 'Running' | 'Pending' | 'Failed';
  durationSeconds?: number;
  errorMessage?: string;
  lastAttemptAt?: string;
}

export interface CreateDeploymentRequestMock {
  packageId: string;
  endpointIds: string[];
  waveSize: number;
  timeoutMinutes: number;
  maxRetries: number;
  scheduledAt?: string;
}

export interface DiscoveryScanMock {
  id: string;
  cidrRange: string;
  status: 'Scanning' | 'Completed' | 'Failed';
  scannedCount: number;
  totalHosts: number;
  discoveredCount: number;
  startedAt: string;
  completedAt?: string;
}

export interface DiscoveredEndpointMock {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress?: string;
  osName?: string;
  discoveryMethod: 'WMI' | 'Ping' | 'ActiveDirectory';
  status: 'Unmanaged' | 'Managed' | 'Ignored';
  discoveredAt: string;
}

export interface AuditEntryMock {
  id: string;
  timestamp: string;
  actor: string;
  action: 'Login' | 'Logout' | 'CreateUser' | 'DeleteUser' | 'UpdateRole' | 'ChangePassword' | 'CreateEndpoint' | 'DeployPackage' | 'DiscoveryScan';
  target: string;
  result: 'Success' | 'Failed' | 'PreconditionRequired' | 'Rejected';
  ipAddress: string;
  details?: Record<string, unknown>;
}

export interface AgentSettingsMock {
  heartbeatIntervalSeconds: number;
  inventoryIntervalMinutes: number;
  enrollmentTokenExpiryHours: number;
  autoApproveNewEndpoints: boolean;
  enableOfflineAgentCache: boolean;
}

export interface NotificationRuleMock {
  id: string;
  name: string;
  eventCategory: 'EndpointOffline' | 'JobFailed' | 'SecurityAlert' | 'LowDiskSpace';
  channel: 'Email' | 'Webhook' | 'Syslog';
  destination: string;
  isEnabled: boolean;
}
