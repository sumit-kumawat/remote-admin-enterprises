import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../store/useToastStore';

export interface AgentSettingsData {
  heartbeatIntervalSeconds: number;
  inventoryIntervalMinutes: number;
}

export interface NotificationRuleData {
  id: string;
  name: string;
  eventCategory: string;
  channel: string;
  destination: string;
  isEnabled: boolean;
}

const defaultAgentSettings: AgentSettingsData = {
  heartbeatIntervalSeconds: 60,
  inventoryIntervalMinutes: 60,
};

const defaultRules: NotificationRuleData[] = [
  { id: 'rule-1', name: 'Critical Endpoint Offline Alert', eventCategory: 'EndpointStatus', channel: 'Email', destination: 'admin@corp.local', isEnabled: true },
  { id: 'rule-[#2]', name: 'Software Deployment Failure', eventCategory: 'DeploymentJob', channel: 'Syslog', destination: '192.168.1.50:514', isEnabled: true },
  { id: 'rule-3', name: 'Unauthorized Admin Account Created', eventCategory: 'SecurityAudit', channel: 'Webhook', destination: 'https://hooks.corp.local/alerts', isEnabled: true },
];

export function useAgentSettings() {
  return useQuery({
    queryKey: ['agentSettings'],
    queryFn: async () => defaultAgentSettings,
  });
}

export function useUpdateAgentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<AgentSettingsData>) => {
      Object.assign(defaultAgentSettings, settings);
      return defaultAgentSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentSettings'] });
      toast.success('Settings Saved', 'Agent defaults updated successfully.');
    },
  });
}

export function useNotificationRules() {
  return useQuery({
    queryKey: ['notificationRules'],
    queryFn: async () => defaultRules,
  });
}

export function useToggleNotificationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const rule = defaultRules.find((r) => r.id === id);
      if (rule) rule.isEnabled = isEnabled;
      return rule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationRules'] });
      toast.success('Notification Rule Updated');
    },
  });
}
