import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCredentials, createCredential, deleteCredential } from '../api/credentialsApi';
import type { CredentialProfileItem } from '../api/credentialsApi';
import { toast } from '../store/useToastStore';

export const useCredentials = () => {
  return useQuery<CredentialProfileItem[]>({
    queryKey: ['credentials'],
    queryFn: fetchCredentials,
  });
};

export const useCreateCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success('Profile Created', 'Credential Profile created successfully');
    },
    onError: (err: any) => {
      toast.error('Creation Failed', err?.response?.data?.message || 'Failed to create credential profile');
    },
  });
};

export const useDeleteCredential = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success('Profile Deleted', 'Credential Profile deleted');
    },
    onError: (err: any) => {
      toast.error('Delete Failed', err?.response?.data?.message || 'Failed to delete credential profile');
    },
  });
};
