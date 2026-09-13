// MOCK: Agent & System Settings API Layer
import type { AgentSettingsMock, NotificationRuleMock } from '../../types/mock';

let initialAgentSettings: AgentSettingsMock = {
  heartbeatIntervalSeconds: 60,
  inventoryIntervalMinutes: 60,
  enrollmentTokenExpiryHours: 24,
  autoApproveNewEndpoints: false,
  enableOfflineAgentCache: true,
};

let initialNotificationRules: NotificationRuleMock[] = [
  { id: 'rule-1', name: 'Critical Job Failures', eventCategory: 'JobFailed', channel: 'Email', destination: 'sysadmin-alerts@enterprise.local', isEnabled: true },
  { id: 'rule-2', name: 'Endpoint Offline Alert', eventCategory: 'EndpointOffline', channel: 'Webhook', destination: 'https://hooks.enterprise.local/alerts/offline', isEnabled: true },
  { id: 'rule-3', name: 'Low Disk Space Warning', eventCategory: 'LowDiskSpace', channel: 'Email', destination: 'helpdesk@enterprise.local', isEnabled: false },
];

export const settingsMockApi = {
  getAgentSettings: async (): Promise<AgentSettingsMock> => {
    // MOCK: simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { ...initialAgentSettings };
  },

  updateAgentSettings: async (settings: Partial<AgentSettingsMock>): Promise<AgentSettingsMock> => {
    // MOCK: simulate settings persistence
    await new Promise((resolve) => setTimeout(resolve, 250));
    initialAgentSettings = { ...initialAgentSettings, ...settings };
    return { ...initialAgentSettings };
  },

  getNotificationRules: async (): Promise<NotificationRuleMock[]> => {
    // MOCK: simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 150));
    return [...initialNotificationRules];
  },

  toggleNotificationRule: async (id: string, isEnabled: boolean): Promise<NotificationRuleMock> => {
    // MOCK: simulate toggling notification rule
    await new Promise((resolve) => setTimeout(resolve, 200));
    const rule = initialNotificationRules.find((r) => r.id === id);
    if (rule) {
      rule.isEnabled = isEnabled;
    }
    return { ...rule! };
  },
};
