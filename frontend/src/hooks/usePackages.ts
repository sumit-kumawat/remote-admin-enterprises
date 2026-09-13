import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSoftwarePackages,
  uploadSoftwarePackage,
  deleteSoftwarePackage,
} from '../api/packagesApi';
import type { SoftwarePackageItem } from '../api/packagesApi';
import { toast } from '../store/useToastStore';

export const useSoftwarePackages = () => {
  return useQuery<SoftwarePackageItem[]>({
    queryKey: ['packages'],
    queryFn: fetchSoftwarePackages,
  });
};

export const useUploadPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => uploadSoftwarePackage(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package Uploaded', `Installer package '${data.name}' uploaded successfully`);
    },
    onError: (err: any) => {
      toast.error('Upload Failed', err?.response?.data?.message || 'Failed to upload package');
    },
  });
};

export const useDeletePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSoftwarePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package Deleted', 'Software package deleted');
    },
    onError: (err: any) => {
      toast.error('Delete Failed', err?.response?.data?.message || 'Failed to delete package');
    },
  });
};
