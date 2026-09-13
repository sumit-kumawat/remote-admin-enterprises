import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDiscoveredEndpoints,
  startDiscoveryScan,
  importDiscoveredEndpoints,
} from '../api/discoveryApi';
import type { DiscoveredEndpointItem } from '../api/discoveryApi';
import { toast } from '../store/useToastStore';

export const useDiscoveredEndpoints = () => {
  return useQuery<DiscoveredEndpointItem[]>({
    queryKey: ['discovery-results'],
    queryFn: fetchDiscoveredEndpoints,
  });
};

export const useStartDiscoveryScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cidr: string) => startDiscoveryScan(cidr),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-results'] });
      toast.success('Scan Completed', `Detected ${data.length} Windows hosts.`);
    },
    onError: (err: any) => {
      toast.error('Scan Failed', err?.response?.data?.message || 'Discovery scan failed');
    },
  });
};

export const useImportDiscoveredEndpoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (discoveredIds: string[]) => importDiscoveredEndpoints(discoveredIds),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-results'] });
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Import Successful', res.message || 'Imported Windows endpoints into inventory');
    },
    onError: (err: any) => {
      toast.error('Import Failed', err?.response?.data?.message || 'Failed to import endpoints');
    },
  });
};
