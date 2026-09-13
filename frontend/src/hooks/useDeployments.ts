import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deploymentsMockApi } from '../api/mock/deploymentsMock';
import type { CreateDeploymentRequestMock } from '../types/mock';
import { toast } from '../store/useToastStore';

export function useSoftwarePackages() {
  return useQuery({
    queryKey: ['softwarePackages'],
    queryFn: () => deploymentsMockApi.getPackages(),
  });
}

export function useDeploymentsList() {
  return useQuery({
    queryKey: ['deploymentsList'],
    queryFn: () => deploymentsMockApi.getDeployments(),
  });
}

export function useDeploymentDetail(id: string) {
  return useQuery({
    queryKey: ['deploymentDetail', id],
    queryFn: () => deploymentsMockApi.getDeploymentById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: CreateDeploymentRequestMock) => deploymentsMockApi.createDeployment(req),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['deploymentsList'] });
      toast.success('Deployment Created', `Job '${job.id}' for ${job.packageName} has been queued.`);
    },
    onError: () => {
      toast.error('Deployment Failed', 'Could not queue deployment job.');
    },
  });
}

export function useRetryFailedDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deploymentId: string) => deploymentsMockApi.retryFailed(deploymentId),
    onSuccess: (_, deploymentId) => {
      queryClient.invalidateQueries({ queryKey: ['deploymentsList'] });
      queryClient.invalidateQueries({ queryKey: ['deploymentDetail', deploymentId] });
      toast.success('Retrying Targets', `Failed targets for deployment ${deploymentId} re-queued.`);
    },
  });
}
