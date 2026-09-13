export type ScanType = 'ARP' | 'ICMP' | 'TCP' | 'Full';
export type ScanStatus = 'Queued' | 'Running' | 'Paused' | 'Completed' | 'Failed' | 'Cancelled';
export type HostStatus = 'Up' | 'Down' | 'Filtered' | 'Unknown';
export type EventSeverity = 'Info' | 'Warning' | 'Error' | 'Success';

export interface DiscoveryScanDto {
  id: string;
  name: string;
  targetCidr: string;
  scanType: ScanType;
  portSet: string;
  concurrency: number;
  timeoutMs: number;
  rateLimitPps: number;
  status: ScanStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: string;
  progressPercent: number;
  hostsFound: number;
  hostsTotal: number;
}

export interface DiscoveryHostDto {
  id: string;
  scanId: string;
  ipAddress: string;
  macAddress: string | null;
  vendor: string | null;
  hostname: string | null;
  ttl: number | null;
  osGuess: string | null;
  openPortsJson: string | null;
  bannersJson: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  status: HostStatus;
  confidence: number;
  isPromoted: boolean;
  promotedEndpointId: string | null;
}

export interface DiscoveryScanEventDto {
  id: string;
  scanId: string;
  hostId: string | null;
  timestamp: string;
  severity: EventSeverity;
  message: string;
  payloadJson: string | null;
}

export interface DiscoveryScheduleDto {
  id: string;
  name: string;
  cronExpression: string;
  targetCidr: string;
  scanType: ScanType;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface NetworkInterfaceDto {
  name: string;
  description: string;
  ipAddress: string;
  subnetMask: string;
  cidr: string;
  isUp: boolean;
}

export interface CreateScanRequest {
  name?: string;
  targetCidr: string;
  scanType?: ScanType;
  portSet?: string;
  concurrency?: number;
  timeoutMs?: number;
  rateLimitPps?: number;
  confirmedOwnership: boolean;
}

export interface CreateScheduleRequest {
  name: string;
  cronExpression: string;
  targetCidr: string;
  scanType?: ScanType;
  enabled?: boolean;
}

export interface PromoteHostResult {
  hostId: string;
  endpointId: string;
  hostname: string;
  ipAddress: string;
  message: string;
}
