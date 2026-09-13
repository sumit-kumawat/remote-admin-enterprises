import { apiClient } from './client';

export interface CredentialProfileItem {
  id: string;
  name: string;
  username: string;
  description?: string;
  createdAt: string;
}

export const fetchCredentials = async (): Promise<CredentialProfileItem[]> => {
  const response = await apiClient.get<CredentialProfileItem[]>('/api/Credentials');
  return response.data;
};

export const createCredential = async (data: { name: string; username: string; password: string; description?: string }) => {
  const response = await apiClient.post('/api/Credentials', data);
  return response.data;
};

export const deleteCredential = async (id: string) => {
  const response = await apiClient.delete(`/api/Credentials/${id}`);
  return response.data;
};
