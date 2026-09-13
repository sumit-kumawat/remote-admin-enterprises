import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpointsApi } from '../api/endpointsApi';
import type { CreateEndpointRequest } from '../types/api';
import { toast } from '../store/useToastStore';

export function useEndpointsList(params?: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['endpoints', params],
    queryFn: () => endpointsApi.getAll(params),
    refetchInterval: 15000,
  });
}

export function useEndpointDetail(id: string) {
  return useQuery({
    queryKey: ['endpointDetail', id],
    queryFn: () => endpointsApi.getById(id),
    enabled: Boolean(id),
    refetchInterval: 15000,
  });
}

export function useCreateEndpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEndpointRequest) => endpointsApi.create(payload),
    onSuccess: (res, payload) => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Endpoint Registered', `Endpoint '${res.data?.hostname || payload.hostname}' was added successfully.`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create endpoint';
      toast.error('Add Endpoint Failed', msg);
    },
  });
}

export function useImportEndpointsFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => endpointsApi.importFile(formData),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('File Import Complete', res.message || 'File imported successfully');
    },
    onError: (err: any) => {
      toast.error('Import Failed', err?.response?.data?.message || 'File import failed');
    },
  });
}

export function useBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ action, endpointIds }: { action: string; endpointIds: string[] }) =>
      endpointsApi.bulkAction(action, endpointIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Bulk Action Complete', `Bulk action '${variables.action}' completed`);
    },
    onError: (err: any) => {
      toast.error('Bulk Action Failed', err?.response?.data?.message || 'Bulk action failed');
    },
  });
}

export function useCreateLocalAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (endpointIds: string[]) => endpointsApi.createLocalAdmin(endpointIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Account Provisioned', 'Provisioned managed account user-"ra" in local Administrators group');
    },
    onError: (err: any) => {
      toast.error('Provisioning Failed', err?.response?.data?.message || 'Failed to provision user-"ra"');
    },
  });
}
