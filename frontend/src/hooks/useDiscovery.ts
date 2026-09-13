import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryApi } from '../api/discoveryApi';
import type { CreateScanRequest, CreateScheduleRequest } from '../types/discovery';

export function useSubnets() {
  return useQuery({
    queryKey: ['discovery-subnets'],
    queryFn: () => discoveryApi.getSubnets(),
    staleTime: 60000,
  });
}

export function useScans() {
  return useQuery({
    queryKey: ['discovery-scans'],
    queryFn: () => discoveryApi.getScans(),
    refetchInterval: 10000,
  });
}

export function useScan(id?: string) {
  return useQuery({
    queryKey: ['discovery-scan', id],
    queryFn: () => discoveryApi.getScan(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'Running' || status === 'Queued' ? 3000 : false;
    },
  });
}

export function useScanHosts(id?: string) {
  return useQuery({
    queryKey: ['discovery-hosts', id],
    queryFn: () => discoveryApi.getScanHosts(id!),
    enabled: !!id,
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateScanRequest) => discoveryApi.createScan(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-scans'] });
    },
  });
}

export function usePauseScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discoveryApi.pauseScan(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-scan', id] });
      queryClient.invalidateQueries({ queryKey: ['discovery-scans'] });
    },
  });
}

export function useResumeScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discoveryApi.resumeScan(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-scan', id] });
      queryClient.invalidateQueries({ queryKey: ['discovery-scans'] });
    },
  });
}

export function useCancelScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discoveryApi.cancelScan(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-scan', id] });
      queryClient.invalidateQueries({ queryKey: ['discovery-scans'] });
    },
  });
}

export function usePromoteHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hostId: string) => discoveryApi.promoteHost(hostId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-hosts'] });
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
    },
  });
}

export function useSchedules() {
  return useQuery({
    queryKey: ['discovery-schedules'],
    queryFn: () => discoveryApi.getSchedules(),
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateScheduleRequest) => discoveryApi.createSchedule(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discoveryApi.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-schedules'] });
    },
  });
}
