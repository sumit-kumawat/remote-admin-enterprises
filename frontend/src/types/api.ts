// Exact Swagger & C# Dto Types for Remote Admin Enterprises API

export type UserRole = 'SuperAdmin' | 'Admin' | 'Operator' | 'Auditor' | 'Viewer';

export interface UserDto {
  id: string;
  username: string;
  email?: string | null;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: string | null;
}

export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
  expiresAt: string;
  mustChangePassword: boolean;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
  newPasswordConfirmation?: string;
}

export interface CreateUserRequest {
  username?: string;
  password?: string;
  passwordConfirmation?: string;
  email?: string | null;
  role?: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string | null;
  errors?: string[] | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type EndpointStatus = 'Online' | 'Offline' | 'Unknown';
export type EndpointApprovalStatus = 'PendingApproval' | 'Approved' | 'Rejected';

export interface EndpointDto {
  id: string;
  hostname: string;
  fqdn?: string | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  status: string;
  approvalStatus: string;
  authStatus?: string | null;
  authMode?: string | null;
  authUser?: string | null;
  credentialProfileId?: string | null;
  credentialProfileName?: string | null;
  deviceType?: string | null;
  agentStatus?: string | null;
  agentVersion?: string | null;
  windowsEdition?: string | null;
  windowsVersion?: string | null;
  description?: string | null;
  location?: string | null;
  groupName?: string | null;
  groupId?: string | null;
  lastHeartbeat?: string | null;
  lastInventory?: string | null;
  lastSuccessfulJob?: string | null;
  lastFailedJob?: string | null;
  createdAt: string;
}

export interface LocalAccountDto {
  username: string;
  fullName?: string | null;
  description?: string | null;
  isEnabled: boolean;
  isAdmin: boolean;
  groups: string[];
  passwordStatus?: string | null;
}

export interface SecuritySoftwareDto {
  productName: string;
  vendor?: string | null;
  version?: string | null;
  status: string;
  isEnabled: boolean;
  isRunning: boolean;
  lastUpdated?: string | null;
}

export interface HardwareInventoryDto {
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  biosVersion?: string | null;
  processorName?: string | null;
  cores?: number | null;
  logicalProcessors?: number | null;
  clockSpeedMhz?: number | null;
  totalRamMb?: number | null;
  availableRamMb?: number | null;
  gpuName?: string | null;
  gpuDriverVersion?: string | null;
  architecture?: string | null;
  installDate?: string | null;
  lastBoot?: string | null;
  collectedAt?: string | null;
}

export interface NetworkInterfaceDto {
  adapterName?: string | null;
  ipv4Address?: string | null;
  ipv6Address?: string | null;
  macAddress?: string | null;
  connectionState?: string | null;
  linkSpeedMbps?: number | null;
  gateway?: string | null;
  dnsServers?: string | null;
}

export interface SoftwareInventoryItemDto {
  id: string;
  softwareName: string;
  version?: string | null;
  publisher?: string | null;
  installDate?: string | null;
  architecture?: string | null;
  installPath?: string | null;
}

export interface StorageDriveDto {
  driveLetter?: string | null;
  capacityGb?: number | null;
  freeSpaceGb?: number | null;
  usedSpaceGb?: number | null;
  fileSystem?: string | null;
  diskType?: string | null;
}

export interface EndpointDetailDto extends EndpointDto {
  hardware?: HardwareInventoryDto | null;
  networkInterfaces: NetworkInterfaceDto[];
  software: SoftwareInventoryItemDto[];
  drives: StorageDriveDto[];
  localAccounts?: LocalAccountDto[];
  securitySoftware?: SecuritySoftwareDto[];
}

export interface CreateEndpointRequest {
  hostname?: string;
  fqdn?: string | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  description?: string | null;
  location?: string | null;
  groupId?: string | null;
}

export interface DashboardStatsDto {
  totalEndpoints: number;
  onlineEndpoints: number;
  offlineEndpoints: number;
  unknownEndpoints: number;
  windows10Count: number;
  windows11Count: number;
  agentHealthy: number;
  agentNeedsUpdate: number;
  lowDiskSpace: number;
  pendingJobs: number;
  runningJobs: number;
  failedJobs: number;
  recentDeployments: number;
  managementAccountCoverage: number;
}

export interface SystemInfoDto {
  product: string;
  version: string;
  author: string;
  website: string;
  support: string;
  serverTime: string;
  environment: string;
}
