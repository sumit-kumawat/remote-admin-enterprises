import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../api/systemApi';

export function useSystemInfo() {
  return useQuery({
    queryKey: ['systemInfo'],
    queryFn: () => systemApi.getInfo(),
    staleTime: 60 * 1000,
  });
}
