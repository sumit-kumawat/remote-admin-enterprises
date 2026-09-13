import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsMockApi } from '../api/mock/settingsMock';
import type { AgentSettingsMock } from '../types/mock';
import { toast } from '../store/useToastStore';

export function useAgentSettings() {
  return useQuery({
    queryKey: ['agentSettings'],
    queryFn: () => settingsMockApi.getAgentSettings(),
  });
}

export function useUpdateAgentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<AgentSettingsMock>) => settingsMockApi.updateAgentSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentSettings'] });
      toast.success('Settings Saved', 'Agent defaults updated successfully.');
    },
  });
}

export function useNotificationRules() {
  return useQuery({
    queryKey: ['notificationRules'],
    queryFn: () => settingsMockApi.getNotificationRules(),
  });
}

export function useToggleNotificationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      settingsMockApi.toggleNotificationRule(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationRules'] });
      toast.success('Notification Rule Updated');
    },
  });
}
