import { apiClient } from './client';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  result: string;
  ipAddress?: string;
  detailsJson?: string;
}

export const fetchAuditLogs = async (actor?: string, action?: string, result?: string): Promise<AuditLogItem[]> => {
  const params: Record<string, string> = {};
  if (actor && actor !== 'All') params.actor = actor;
  if (action && action !== 'All') params.action = action;
  if (result && result !== 'All') params.result = result;

  const response = await apiClient.get<AuditLogItem[]>('/api/Audit/logs', { params });
  return response.data;
};
