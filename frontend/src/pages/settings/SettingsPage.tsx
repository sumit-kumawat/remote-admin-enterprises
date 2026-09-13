import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSystemInfo } from '../../hooks/useSystem';
import { useChangePassword } from '../../hooks/useAuth';
import {
  useAgentSettings,
  useUpdateAgentSettings,
  useNotificationRules,
  useToggleNotificationRule,
} from '../../hooks/useSettings';
import type { NotificationRuleData } from '../../hooks/useSettings';
import { useCredentials, useCreateCredential, useDeleteCredential } from '../../hooks/useCredentials';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  User,
  Server,
  Sliders,
  BellRing,
  Info,
  KeyRound,
  Shield,
  Save,
  Key,
  Plus,
  Trash2,
} from 'lucide-react';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
    newPasswordConfirmation: z.string().min(8, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: 'Passwords do not match',
    path: ['newPasswordConfirmation'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials' | 'system' | 'agent' | 'notifications' | 'about'>('profile');

  const { data: sysInfo, isLoading: isSysLoading } = useSystemInfo();
  useAgentSettings();
  const updateAgentMutation = useUpdateAgentSettings();
  const { data: notificationRules = [] } = useNotificationRules();
  const toggleRuleMutation = useToggleNotificationRule();
  const changePasswordMutation = useChangePassword();

  const { data: credentials = [], isLoading: isCredsLoading } = useCredentials();
  const createCredMutation = useCreateCredential();
  const deleteCredMutation = useDeleteCredential();

  const [credName, setCredName] = useState('');
  const [credUser, setCredUser] = useState('');
  const [credPass, setCredPass] = useState('');
  const [credDesc, setCredDesc] = useState('');

  const [hbSeconds, setHbSeconds] = useState(60);
  const [invMinutes, setInvMinutes] = useState(60);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        reset();
      },
    });
  };

  const handleCreateCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credName.trim() || !credUser.trim() || !credPass.trim()) return;

    createCredMutation.mutate(
      { name: credName.trim(), username: credUser.trim(), password: credPass.trim(), description: credDesc.trim() },
      {
        onSuccess: () => {
          setCredName('');
          setCredUser('');
          setCredPass('');
          setCredDesc('');
        },
      }
    );
  };

  const handleSaveAgentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateAgentMutation.mutate({
      heartbeatIntervalSeconds: hbSeconds,
      inventoryIntervalMinutes: invMinutes,
    });
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <h1 className="text-base font-bold text-slate-900">System Configuration & Administrative Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage account security, credential profiles, agent sync parameters, alert triggers, and server info</p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
          {[
            { id: 'profile', label: 'User Profile & Password', icon: User },
            { id: 'credentials', label: 'Credential Profiles', icon: Key },
            { id: 'system', label: 'Server & Database Info', icon: Server },
            { id: 'agent', label: 'Agent Defaults', icon: Sliders },
            { id: 'notifications', label: 'Alert Notifications', icon: BellRing },
            { id: 'about', label: 'About & License', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-medium transition-colors ${
                  isActive
                    ? 'border-[#2F3EA0] text-[#2F3EA0] bg-white font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* Profile & Password Tab */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-3">
                <div className="font-semibold text-slate-900 text-xs border-b pb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-[#2F3EA0]" />
                  <span>Account Identity Profile</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Username</span>
                    <span className="font-bold text-slate-900">{user?.username}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email</span>
                    <span className="text-slate-800">{user?.email || 'No email configured'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Administrative Role</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-800 font-semibold text-xs mt-0.5">
                      <Shield className="h-3 w-3" /> {user?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="p-4 border border-slate-200 rounded bg-white space-y-3">
                <div className="font-semibold text-slate-900 text-xs border-b pb-2 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-600" />
                  <span>Change Console Password</span>
                </div>

                <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      {...register('currentPassword')}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                    />
                    {errors.currentPassword && <p className="text-xs text-rose-600 mt-0.5">{errors.currentPassword.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      {...register('newPassword')}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                    />
                    {errors.newPassword && <p className="text-xs text-rose-600 mt-0.5">{errors.newPassword.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      {...register('newPasswordConfirmation')}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                    />
                    {errors.newPasswordConfirmation && (
                      <p className="text-xs text-rose-600 mt-0.5">{errors.newPasswordConfirmation.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#2F3EA0] hover:bg-[#263385] rounded transition-colors disabled:opacity-50"
                  >
                    {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Credential Profiles Tab */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              <div className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-3">
                <h2 className="font-semibold text-slate-900 text-xs border-b pb-2">Create Endpoint Login Credential Profile</h2>
                <form onSubmit={handleCreateCredential} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Profile Name</label>
                    <input
                      type="text"
                      value={credName}
                      onChange={(e) => setCredName(e.target.value)}
                      placeholder="e.g. Domain Admins"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={credUser}
                      onChange={(e) => setCredUser(e.target.value)}
                      placeholder="e.g. CORP\Administrator"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={credPass}
                      onChange={(e) => setCredPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={createCredMutation.isPending}
                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#263385] rounded transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> Create Profile
                    </button>
                  </div>
                </form>
              </div>

              {/* Credential Profiles Table */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
                  Stored Endpoint Credential Profiles ({credentials.length})
                </div>
                {isCredsLoading ? (
                  <LoadingSkeleton rows={3} />
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                      <tr>
                        <th className="p-2.5">Profile Name</th>
                        <th className="p-2.5">Username</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Created</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {credentials.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                          <td className="p-2.5 font-mono text-slate-800">{c.username}</td>
                          <td className="p-2.5 text-slate-600">{c.description || '—'}</td>
                          <td className="p-2.5 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => deleteCredMutation.mutate(c.id)}
                              className="text-rose-600 hover:text-rose-800 font-medium p-1 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* System Info Tab */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              {isSysLoading ? (
                <LoadingSkeleton rows={4} />
              ) : (
                <div className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-3">
                  <div className="font-semibold text-slate-900 text-xs border-b pb-2">Live Backend Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 bg-white border rounded">
                      <div className="text-slate-500 text-[11px]">Product Title</div>
                      <div className="font-bold text-slate-900 text-xs">{sysInfo?.product || 'Remote Admin Enterprises'}</div>
                    </div>
                    <div className="p-3 bg-white border rounded">
                      <div className="text-slate-500 text-[11px]">Version</div>
                      <div className="font-mono text-slate-900 text-xs">{sysInfo?.version || 'v1.0'}</div>
                    </div>
                    <div className="p-3 bg-white border rounded">
                      <div className="text-slate-500 text-[11px]">Environment</div>
                      <div className="font-semibold text-emerald-700 text-xs">{sysInfo?.environment || 'Production'}</div>
                    </div>
                    <div className="p-3 bg-white border rounded">
                      <div className="text-slate-500 text-[11px]">Server UTC Time</div>
                      <div className="font-mono text-slate-900 text-xs">{sysInfo?.serverTime ? new Date(sysInfo.serverTime).toUTCString() : '—'}</div>
                    </div>
                    <div className="p-3 bg-white border rounded">
                      <div className="text-slate-500 text-[11px]">Author</div>
                      <div className="font-medium text-slate-900 text-xs">{sysInfo?.author || 'Sumit Kumawat'}</div>
                    </div>
                    <div className="p-3 bg-white border rounded">
                      <div className="text-slate-500 text-[11px]">Support Email</div>
                      <div className="font-mono text-blue-600 text-xs">{sysInfo?.support || 'hello@sumitkumawat.com'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agent Defaults Tab */}
          {activeTab === 'agent' && (
            <form onSubmit={handleSaveAgentSettings} className="space-y-4 max-w-lg">
              <div className="p-4 border border-slate-200 rounded bg-white space-y-3">
                <div className="font-semibold text-slate-900 text-xs border-b pb-2">Agent Sync & Telemetry Frequencies</div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heartbeat Interval (Seconds)</label>
                  <input
                    type="number"
                    value={hbSeconds}
                    onChange={(e) => setHbSeconds(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hardware/Software Inventory Sync (Minutes)</label>
                  <input
                    type="number"
                    value={invMinutes}
                    onChange={(e) => setInvMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateAgentMutation.isPending}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#2F3EA0] hover:bg-[#263385] rounded transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" /> Save Agent Defaults
                </button>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <div className="font-semibold text-slate-800 text-xs">Alert Notification Triggers & Destinations</div>
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5">Rule Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Channel</th>
                      <th className="p-2.5">Destination</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {notificationRules.map((rule: NotificationRuleData) => (
                      <tr key={rule.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-900">{rule.name}</td>
                        <td className="p-2.5 font-mono text-slate-700">{rule.eventCategory}</td>
                        <td className="p-2.5 text-slate-800">{rule.channel}</td>
                        <td className="p-2.5 font-mono text-slate-600">{rule.destination}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => toggleRuleMutation.mutate({ id: rule.id, isEnabled: !rule.isEnabled })}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                              rule.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {rule.isEnabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-3 max-w-lg">
              <div className="flex items-center gap-3 border-b pb-3">
                <img
                  src="https://iconape.com/wp-content/files/yc/116248/png/windows-server-2.png"
                  alt="Windows Server Logo"
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Remote Admin Enterprises</h2>
                  <p className="text-slate-500 text-xs">Enterprise Windows Endpoint Management Platform</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>Designed for air-gapped network operations, centralizing inventory, software deployment, and discovery.</p>
                <div className="pt-2 border-t text-slate-500 font-mono text-[11px]">
                  <div>Version: v1.0.0 (Release)</div>
                  <div>Author: Sumit Kumawat</div>
                  <div>Website: www.sumitkumawat.com</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
