// MOCK: Audit Log API Layer
import type { AuditEntryMock } from '../../types/mock';

let initialAuditLogs: AuditEntryMock[] = [
  {
    id: 'aud-1',
    timestamp: '2026-09-13T13:16:00Z',
    actor: 'admin',
    action: 'ChangePassword',
    target: 'UserAccount',
    result: 'Success',
    ipAddress: '127.0.0.1',
    details: { reason: 'First login password change completed', passwordChangedAt: '2026-09-13T13:16:00Z' },
  },
  {
    id: 'aud-2',
    timestamp: '2026-09-13T13:15:51Z',
    actor: 'admin',
    action: 'Login',
    target: 'Session',
    result: 'Success',
    ipAddress: '127.0.0.1',
    details: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', authMethod: 'Password' },
  },
  {
    id: 'aud-3',
    timestamp: '2026-09-13T12:45:10Z',
    actor: 'admin',
    action: 'CreateEndpoint',
    target: 'WORKSTATION-01',
    result: 'Success',
    ipAddress: '192.168.1.5',
    details: { hostname: 'WORKSTATION-01', ipAddress: '192.168.1.101', approvalStatus: 'PendingApproval' },
  },
  {
    id: 'aud-4',
    timestamp: '2026-09-13T11:20:00Z',
    actor: 'operator1',
    action: 'DeployPackage',
    target: 'Google Chrome Enterprise',
    result: 'Success',
    ipAddress: '192.168.1.22',
    details: { jobId: 'job-101', targetCount: 45, waveSize: 15 },
  },
  {
    id: 'aud-5',
    timestamp: '2026-09-13T10:15:30Z',
    actor: 'admin',
    action: 'DeleteUser',
    target: 'testuser',
    result: 'Success',
    ipAddress: '192.168.1.5',
    details: { deletedUserId: 'user-guid-99' },
  },
  {
    id: 'aud-6',
    timestamp: '2026-09-13T09:30:12Z',
    actor: 'auditor1',
    action: 'Login',
    target: 'Session',
    result: 'Failed',
    ipAddress: '192.168.1.88',
    details: { failureReason: 'Invalid credentials' },
  },
  {
    id: 'aud-7',
    timestamp: '2026-09-12T16:00:00Z',
    actor: 'admin',
    action: 'DiscoveryScan',
    target: '192.168.1.0/24',
    result: 'Success',
    ipAddress: '192.168.1.5',
    details: { discoveredHosts: 18, totalScanned: 254 },
  },
];

export const auditMockApi = {
  getAuditLogs: async (params?: {
    actor?: string;
    action?: string;
    result?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditEntryMock[]> => {
    // MOCK: simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 200));
    let filtered = [...initialAuditLogs];
    if (params?.actor && params.actor !== 'All') {
      filtered = filtered.filter((a) => a.actor.toLowerCase().includes(params.actor!.toLowerCase()));
    }
    if (params?.action && params.action !== 'All') {
      filtered = filtered.filter((a) => a.action === params.action);
    }
    if (params?.result && params.result !== 'All') {
      filtered = filtered.filter((a) => a.result === params.result);
    }
    return filtered;
  },
};
