import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryMockApi } from '../api/mock/discoveryMock';
import { toast } from '../store/useToastStore';

export function useDiscoveryScans() {
  return useQuery({
    queryKey: ['discoveryScans'],
    queryFn: () => discoveryMockApi.getScans(),
  });
}

export function useDiscoveredEndpoints() {
  return useQuery({
    queryKey: ['discoveredEndpoints'],
    queryFn: () => discoveryMockApi.getDiscoveredEndpoints(),
  });
}

export function useStartDiscoveryScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cidrRange: string) => discoveryMockApi.startScan(cidrRange),
    onSuccess: (scan) => {
      queryClient.invalidateQueries({ queryKey: ['discoveryScans'] });
      toast.success('Scan Started', `Discovery scan for ${scan.cidrRange} initiated.`);
    },
  });
}

export function useAddToManaged() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => discoveryMockApi.addToManaged(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['discoveredEndpoints'] });
      toast.success('Added to Managed', res.message);
    },
  });
}
