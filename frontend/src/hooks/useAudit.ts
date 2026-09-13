import { useQuery } from '@tanstack/react-query';
import { auditMockApi } from '../api/mock/auditMock';

export function useAuditLogs(params?: {
  actor?: string;
  action?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => auditMockApi.getAuditLogs(params),
  });
}
