import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '../api/auditApi';
import type { AuditLogItem } from '../api/auditApi';

export const useAuditLogs = (filters?: { actor?: string; action?: string; result?: string }) => {
  return useQuery<AuditLogItem[]>({
    queryKey: ['audit-logs', filters],
    queryFn: () => fetchAuditLogs(filters?.actor, filters?.action, filters?.result),
    refetchInterval: 15000,
  });
};
