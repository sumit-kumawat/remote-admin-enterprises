import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDeploymentJobs, createDeploymentJob } from '../api/deploymentsApi';
import type { DeploymentJobItem } from '../api/deploymentsApi';
import { toast } from '../store/useToastStore';

export const useDeploymentJobs = () => {
  return useQuery<DeploymentJobItem[]>({
    queryKey: ['deployments'],
    queryFn: fetchDeploymentJobs,
    refetchInterval: 15000,
  });
};

export const useCreateDeployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeploymentJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Deployment Queued', 'Software deployment job created and dispatched');
    },
    onError: (err: any) => {
      toast.error('Deployment Failed', err?.response?.data?.message || 'Failed to trigger deployment job');
    },
  });
};
