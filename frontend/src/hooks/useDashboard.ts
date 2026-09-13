import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';

export function useDashboardStats(refetchIntervalMs: number = 15000) {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: refetchIntervalMs,
  });
}
