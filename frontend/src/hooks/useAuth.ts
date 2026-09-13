import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useToastStore';
import type { LoginRequest, ChangePasswordRequest, CreateUserRequest } from '../types/api';

export function useCurrentUser() {
  const { token, setUser, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser', token],
    queryFn: async () => {
      const user = await authApi.getMe();
      setUser(user);
      return user;
    },
    enabled: Boolean(token) && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      toast.success('Login Successful', `Welcome back, ${data.user.username}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Invalid username or password';
      toast.error('Login Failed', msg);
    },
  });
}

export function useChangePassword() {
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authApi.changePassword(payload),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }
      toast.success('Password Changed', 'Your password has been successfully updated.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to change password';
      toast.error('Password Change Failed', msg);
    },
  });
}

export function useUsersList() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['usersList'],
    queryFn: () => authApi.getUsers(),
    enabled: isAuthenticated,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => authApi.createUser(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      toast.success('User Created', `User '${variables.username}' was successfully created.`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create user';
      toast.error('Create User Failed', msg);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      toast.success('User Deleted', 'Account was successfully removed.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to delete user';
      toast.error('Delete User Failed', msg);
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => authApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      toast.success('Role Updated', 'User permissions have been updated.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update user role';
      toast.error('Role Update Failed', msg);
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => authApi.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      toast.success('User Deactivated', 'Account has been deactivated.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to deactivate user';
      toast.error('Deactivation Failed', msg);
    },
  });
}
