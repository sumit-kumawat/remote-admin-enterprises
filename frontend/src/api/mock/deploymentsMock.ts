// MOCK: Software Deployment API Layer
import type {
  SoftwarePackage,
  DeploymentJobMock,
  DeploymentEndpointStatusMock,
  CreateDeploymentRequestMock,
} from '../../types/mock';

let initialPackages: SoftwarePackage[] = [
  { id: 'pkg-1', name: '7-Zip Enterprise', version: '24.01', publisher: 'Igor Pavlov', architecture: 'x64', sizeMb: 5.2, installerType: 'MSI', status: 'Ready', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'pkg-2', name: 'Google Chrome Enterprise', version: '128.0.6613.120', publisher: 'Google LLC', architecture: 'x64', sizeMb: 110.5, installerType: 'MSI', status: 'Ready', createdAt: '2026-09-05T14:30:00Z' },
  { id: 'pkg-3', name: 'Mozilla Firefox ESR', version: '115.15.0', publisher: 'Mozilla Corporation', architecture: 'x64', sizeMb: 68.0, installerType: 'MSI', status: 'Ready', createdAt: '2026-09-08T09:15:00Z' },
  { id: 'pkg-4', name: 'VS Code Enterprise', version: '1.92.2', publisher: 'Microsoft Corporation', architecture: 'x64', sizeMb: 92.4, installerType: 'MSI', status: 'Ready', createdAt: '2026-09-10T16:00:00Z' },
  { id: 'pkg-5', name: 'Remote Admin Agent Update', version: '2.4.1', publisher: 'Sumit Kumawat', architecture: 'x64', sizeMb: 18.2, installerType: 'EXE', status: 'Ready', createdAt: '2026-09-12T11:20:00Z' },
];

let initialDeployments: DeploymentJobMock[] = [
  { id: 'job-101', packageName: 'Google Chrome Enterprise', packageVersion: '128.0.6613.120', targetCount: 45, successCount: 42, failedCount: 2, pendingCount: 0, runningCount: 1, status: 'Completed', waveSize: 15, timeoutMinutes: 60, maxRetries: 3, scheduledAt: '2026-09-12T14:00:00Z', createdBy: 'admin' },
  { id: 'job-102', packageName: 'Remote Admin Agent Update', packageVersion: '2.4.1', targetCount: 120, successCount: 110, failedCount: 5, pendingCount: 2, runningCount: 3, status: 'Running', waveSize: 25, timeoutMinutes: 120, maxRetries: 3, scheduledAt: '2026-09-13T08:00:00Z', createdBy: 'admin' },
  { id: 'job-103', packageName: 'VS Code Enterprise', packageVersion: '1.92.2', targetCount: 12, successCount: 12, failedCount: 0, pendingCount: 0, runningCount: 0, status: 'Completed', waveSize: 5, timeoutMinutes: 45, maxRetries: 2, scheduledAt: '2026-09-11T16:30:00Z', createdBy: 'admin' },
];

export const deploymentsMockApi = {
  getPackages: async (): Promise<SoftwarePackage[]> => {
    // MOCK: simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...initialPackages];
  },

  getDeployments: async (): Promise<DeploymentJobMock[]> => {
    // MOCK: simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...initialDeployments];
  },

  getDeploymentById: async (id: string): Promise<{ deployment: DeploymentJobMock; endpoints: DeploymentEndpointStatusMock[] }> => {
    // MOCK: simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 250));
    const dep = initialDeployments.find((d) => d.id === id) || initialDeployments[0];
    const mockEndpoints: DeploymentEndpointStatusMock[] = [
      { endpointId: 'ep-1', hostname: 'WORKSTATION-01', ipAddress: '192.168.1.101', status: 'Completed', durationSeconds: 45, lastAttemptAt: '2026-09-13T08:05:00Z' },
      { endpointId: 'ep-2', hostname: 'WORKSTATION-02', ipAddress: '192.168.1.102', status: 'Completed', durationSeconds: 42, lastAttemptAt: '2026-09-13T08:06:00Z' },
      { endpointId: 'ep-3', hostname: 'SERVER-DC01', ipAddress: '192.168.1.10', status: 'Failed', durationSeconds: 120, errorMessage: 'Timeout waiting for Windows Installer service lock', lastAttemptAt: '2026-09-13T08:12:00Z' },
      { endpointId: 'ep-4', hostname: 'LAPTOP-HR05', ipAddress: '192.168.1.105', status: 'Running', lastAttemptAt: '2026-09-13T08:15:00Z' },
      { endpointId: 'ep-5', hostname: 'DESKTOP-FIN02', ipAddress: '192.168.1.108', status: 'Pending' },
    ];
    return { deployment: dep, endpoints: mockEndpoints };
  },

  createDeployment: async (req: CreateDeploymentRequestMock): Promise<DeploymentJobMock> => {
    // MOCK: simulate API mutation
    await new Promise((resolve) => setTimeout(resolve, 300));
    const pkg = initialPackages.find((p) => p.id === req.packageId) || initialPackages[0];
    const newJob: DeploymentJobMock = {
      id: `job-${Math.floor(100 + Math.random() * 900)}`,
      packageName: pkg.name,
      packageVersion: pkg.version,
      targetCount: req.endpointIds.length,
      successCount: 0,
      failedCount: 0,
      pendingCount: req.endpointIds.length,
      runningCount: 0,
      status: 'Queued',
      waveSize: req.waveSize,
      timeoutMinutes: req.timeoutMinutes,
      maxRetries: req.maxRetries,
      scheduledAt: req.scheduledAt || new Date().toISOString(),
      createdBy: 'admin',
    };
    initialDeployments = [newJob, ...initialDeployments];
    return newJob;
  },

  retryFailed: async (deploymentId: string): Promise<{ success: boolean; message: string }> => {
    // MOCK: simulate retrying failed targets
    await new Promise((resolve) => setTimeout(resolve, 300));
    const dep = initialDeployments.find((d) => d.id === deploymentId);
    if (dep) {
      dep.status = 'Running';
      dep.pendingCount += dep.failedCount;
      dep.failedCount = 0;
    }
    return { success: true, message: `Retrying failed targets for deployment ${deploymentId}` };
  },
};
