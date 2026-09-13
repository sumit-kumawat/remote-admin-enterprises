import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpointsApi } from '../api/endpointsApi';
import type { CreateEndpointRequest } from '../types/api';
import { toast } from '../store/useToastStore';

export function useEndpointsList(params?: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['endpoints', params],
    queryFn: () => endpointsApi.getAll(params),
    refetchInterval: 30000,
  });
}

export function useEndpointDetail(id: string) {
  return useQuery({
    queryKey: ['endpointDetail', id],
    queryFn: () => endpointsApi.getById(id),
    enabled: Boolean(id),
    refetchInterval: 30000,
  });
}

export function useCreateEndpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEndpointRequest) => endpointsApi.create(payload),
    onSuccess: (res, payload) => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      toast.success('Endpoint Registered', `Endpoint '${res.data?.hostname || payload.hostname}' was added successfully.`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create endpoint';
      toast.error('Add Endpoint Failed', msg);
    },
  });
}
