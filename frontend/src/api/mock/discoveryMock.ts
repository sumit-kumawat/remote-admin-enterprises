// MOCK: Discovery API Layer
import type { DiscoveryScanMock, DiscoveredEndpointMock } from '../../types/mock';

let initialScans: DiscoveryScanMock[] = [
  { id: 'scan-1', cidrRange: '192.168.1.0/24', status: 'Completed', scannedCount: 254, totalHosts: 254, discoveredCount: 18, startedAt: '2026-09-12T10:00:00Z', completedAt: '2026-09-12T10:04:30Z' },
  { id: 'scan-2', cidrRange: '10.0.5.0/24', status: 'Completed', scannedCount: 254, totalHosts: 254, discoveredCount: 8, startedAt: '2026-09-11T15:30:00Z', completedAt: '2026-09-11T15:33:15Z' },
];

let initialDiscovered: DiscoveredEndpointMock[] = [
  { id: 'disc-1', hostname: 'WIN11-EXEC-01', ipAddress: '192.168.1.145', macAddress: '00:15:5D:01:22:45', osName: 'Windows 11 Enterprise 23H2', discoveryMethod: 'WMI', status: 'Unmanaged', discoveredAt: '2026-09-12T10:02:15Z' },
  { id: 'disc-2', hostname: 'WIN10-DEV-09', ipAddress: '192.168.1.189', macAddress: '00:15:5D:01:44:88', osName: 'Windows 10 Pro 22H2', discoveryMethod: 'Ping', status: 'Unmanaged', discoveredAt: '2026-09-12T10:03:00Z' },
  { id: 'disc-3', hostname: 'SERVER-SQL02', ipAddress: '10.0.5.22', macAddress: '00:50:56:AB:12:99', osName: 'Windows Server 2022', discoveryMethod: 'ActiveDirectory', status: 'Managed', discoveredAt: '2026-09-11T15:31:00Z' },
  { id: 'disc-4', hostname: 'WORKSTATION-QA03', ipAddress: '192.168.1.201', macAddress: '00:15:5D:02:11:77', osName: 'Windows 11 Pro 23H2', discoveryMethod: 'WMI', status: 'Unmanaged', discoveredAt: '2026-09-12T10:04:10Z' },
];

export const discoveryMockApi = {
  getScans: async (): Promise<DiscoveryScanMock[]> => {
    // MOCK: simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...initialScans];
  },

  getDiscoveredEndpoints: async (): Promise<DiscoveredEndpointMock[]> => {
    // MOCK: simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...initialDiscovered];
  },

  startScan: async (cidrRange: string): Promise<DiscoveryScanMock> => {
    // MOCK: simulate starting discovery scan
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newScan: DiscoveryScanMock = {
      id: `scan-${Math.floor(10 + Math.random() * 90)}`,
      cidrRange,
      status: 'Scanning',
      scannedCount: 15,
      totalHosts: 254,
      discoveredCount: 2,
      startedAt: new Date().toISOString(),
    };
    initialScans = [newScan, ...initialScans];
    return newScan;
  },

  addToManaged: async (id: string): Promise<{ success: boolean; message: string }> => {
    // MOCK: simulate adding discovered host to managed endpoints
    await new Promise((resolve) => setTimeout(resolve, 250));
    const ep = initialDiscovered.find((d) => d.id === id);
    if (ep) {
      ep.status = 'Managed';
    }
    return { success: true, message: `Endpoint ${ep?.hostname || id} imported to managed endpoints.` };
  },
};
