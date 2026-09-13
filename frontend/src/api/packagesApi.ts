import { apiClient } from './client';

export interface SoftwarePackageItem {
  id: string;
  name: string;
  version: string;
  architecture: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export const fetchSoftwarePackages = async (): Promise<SoftwarePackageItem[]> => {
  const response = await apiClient.get<SoftwarePackageItem[]>('/api/Packages');
  return response.data;
};

export const uploadSoftwarePackage = async (formData: FormData): Promise<SoftwarePackageItem> => {
  const response = await apiClient.post('/api/Packages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const deleteSoftwarePackage = async (id: string) => {
  const response = await apiClient.delete(`/api/Packages/${id}`);
  return response.data;
};
