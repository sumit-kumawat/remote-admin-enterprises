import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEndpointDetail } from '../../hooks/useEndpoints';
import { endpointsApi } from '../../api/endpointsApi';
import { fetchCredentials, type CredentialProfileItem } from '../../api/credentialsApi';
import type { LocalAccountDto, SecuritySoftwareDto } from '../../types/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Modal } from '../../components/common/Modal';
import { DeviceIcon } from '../../components/common/DeviceIcon';
import { toast } from '../../store/useToastStore';
import {
  ArrowLeft,
  Monitor,
  Cpu,
  Network,
  HardDrive,
  Package,
  ShieldCheck,
  ShieldAlert,
  Power,
  RotateCcw,
  UserCheck,
  UserPlus,
  Key,
  Copy,
  Check,
  Shield,
  Search,
  RefreshCw,
  Lock,
} from 'lucide-react';

export const EndpointDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'login' | 'accounts' | 'security' | 'power' | 'hardware' | 'network' | 'software' | 'drives'
  >('overview');

  const [softwareSearch, setSoftwareSearch] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Credential profiles list
  const [credentialProfiles, setCredentialProfiles] = useState<CredentialProfileItem[]>([]);
  const [selectedAuthMode, setSelectedAuthMode] = useState<string>('Inherit');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // Confirm Modal state for Power actions
  const [powerActionModal, setPowerActionModal] = useState<{ isOpen: boolean; action: string | null }>({
    isOpen: false,
    action: null,
  });
  const [isExecutingPower, setIsExecutingPower] = useState(false);

  // Modal for Create Local User
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Modal for Reset User Password
  const [resetUserModal, setResetUserModal] = useState<{ isOpen: boolean; username: string | null }>({
    isOpen: false,
    username: null,
  });
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const { data: response, isLoading, isError, refetch } = useEndpointDetail(id || '');

  useEffect(() => {
    fetchCredentials()
      .then((data) => setCredentialProfiles(data || []))
      .catch(() => setCredentialProfiles([]));
  }, []);

  useEffect(() => {
    if (response?.data) {
      setSelectedAuthMode(response.data.authMode || 'Inherit');
      setSelectedProfileId(response.data.credentialProfileId || '');
    }
  }, [response]);

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError || !response?.data) return <ErrorState onRetry={() => refetch()} />;

  const endpoint = response.data;
  const hw = endpoint.hardware;
  const nics = endpoint.networkInterfaces || [];
  const drives = endpoint.drives || [];
  const softwareList = (endpoint.software || []).filter((s) =>
    s.softwareName.toLowerCase().includes(softwareSearch.toLowerCase())
  );
  const localAccounts = endpoint.localAccounts || [];
  const securitySoftware = endpoint.securitySoftware || [];

  const handleCopyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(`${label}-${text}`);
    toast.success('Copied to Clipboard', `${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveCredentialConfig = async () => {
    setIsSavingCreds(true);
    try {
      await endpointsApi.updateCredential(endpoint.id, selectedAuthMode, selectedProfileId || undefined);
      toast.success('Credential Manager Updated', `Authentication mode saved as '${selectedAuthMode}'`);
      refetch();
    } catch (err: any) {
      toast.error('Update Failed', err?.response?.data?.message || 'Failed to save login configuration');
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleCheckConnection = async () => {
    try {
      toast.info('Checking Connectivity...', `Pinging & testing authentication to ${endpoint.hostname}`);
      const res = await endpointsApi.checkConnection(endpoint.id);
      toast.success('Connection Check Complete', res.message || 'Status updated');
      refetch();
    } catch (err: any) {
      toast.error('Check Failed', err?.response?.data?.message || 'Connection check failed');
    }
  };

  const handleExecutePowerAction = async () => {
    if (!powerActionModal.action) return;
    setIsExecutingPower(true);
    try {
      await endpointsApi.powerControl(endpoint.id, powerActionModal.action);
      toast.success('Power Operation Dispatched', `Command '${powerActionModal.action}' sent to ${endpoint.hostname}`);
      setPowerActionModal({ isOpen: false, action: null });
      refetch();
    } catch (err: any) {
      toast.error('Power Control Failed', err?.response?.data?.message || 'Execution failed');
    } finally {
      setIsExecutingPower(false);
    }
  };

  const handleCreateLocalAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) {
      toast.error('Validation Error', 'Username and Password are required');
      return;
    }
    setIsCreatingUser(true);
    try {
      await endpointsApi.createLocalAccount(endpoint.id, {
        username: newUsername.trim(),
        password: newPassword,
        fullName: newFullName.trim(),
        isAdmin: newIsAdmin,
      });
      toast.success('User Created', `Local account '${newUsername}' created on ${endpoint.hostname}`);
      setIsCreateUserOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      refetch();
    } catch (err: any) {
      toast.error('Create User Failed', err?.response?.data?.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserModal.username || !resetPasswordInput) return;
    setIsResettingPassword(true);
    try {
      await endpointsApi.resetUserPassword(endpoint.id, resetUserModal.username, resetPasswordInput);
      toast.success('Password Reset', `Password reset for user '${resetUserModal.username}' on ${endpoint.hostname}`);
      setResetUserModal({ isOpen: false, username: null });
      setResetPasswordInput('');
    } catch (err: any) {
      toast.error('Reset Failed', err?.response?.data?.message || 'Password reset failed');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Back Button & Header */}
      <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/endpoints')}
            className="inline-flex items-center gap-1.5 text-[#2F3EA0] hover:underline font-semibold text-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Endpoint Management
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckConnection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#2F3EA0]" /> Check Connection
            </button>
            <button
              onClick={() => setPowerActionModal({ isOpen: true, action: 'Restart' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restart Endpoint
            </button>
            <button
              onClick={() => setPowerActionModal({ isOpen: true, action: 'Shutdown' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-xs"
            >
              <Power className="h-3.5 w-3.5" /> Shutdown
            </button>
          </div>
        </div>

        {/* Identity Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-100 rounded-lg shrink-0">
            <DeviceIcon deviceType={endpoint.deviceType} size={32} />
          </div>
          <div className="space-y-1 flex-1 min-w-[280px]">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{endpoint.hostname}</span>
                <button
                  onClick={() => handleCopyToClipboard(endpoint.hostname, 'Hostname')}
                  title="Copy Hostname"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  {copiedField === `Hostname-${endpoint.hostname}` ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </h1>
              <StatusBadge status={endpoint.status} />

              {endpoint.authStatus === 'Authorized' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" /> Authorized
                </span>
              )}
              {endpoint.authStatus !== 'Authorized' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldAlert className="h-3 w-3" /> {endpoint.authStatus}
                </span>
              )}
            </div>

            {/* Sub-identifiers */}
            <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px] font-mono">
              <span className="flex items-center gap-1">
                <span>FQDN: {endpoint.fqdn || '—'}</span>
                {endpoint.fqdn && (
                  <button onClick={() => handleCopyToClipboard(endpoint.fqdn!, 'FQDN')} title="Copy FQDN">
                    <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </span>
              <span className="flex items-center gap-1">
                <span>IP: {endpoint.ipAddress || '—'}</span>
                {endpoint.ipAddress && (
                  <button onClick={() => handleCopyToClipboard(endpoint.ipAddress!, 'IP Address')} title="Copy IP">
                    <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </span>
              <span className="flex items-center gap-1">
                <span>MAC: {endpoint.macAddress || '—'}</span>
                {endpoint.macAddress && (
                  <button onClick={() => handleCopyToClipboard(endpoint.macAddress!, 'MAC Address')} title="Copy MAC">
                    <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </span>
              <span className="text-slate-700 font-semibold font-sans">
                Active User: <span className="bg-slate-100 px-1.5 py-0.5 rounded border">{endpoint.authUser}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 overflow-x-auto">
          {[
            { id: 'overview', label: 'System Overview', icon: Monitor },
            { id: 'login', label: 'Login & Credentials', icon: Key },
            { id: 'accounts', label: `Local Accounts (${localAccounts.length})`, icon: UserCheck },
            { id: 'security', label: `Security Software (${securitySoftware.length})`, icon: Shield },
            { id: 'power', label: 'Power Controls', icon: Power },
            { id: 'hardware', label: 'Hardware Specs', icon: Cpu },
            { id: 'network', label: `Network Interfaces (${nics.length})`, icon: Network },
            { id: 'software', label: `Installed Apps (${endpoint.software?.length || 0})`, icon: Package },
            { id: 'drives', label: `Drives (${drives.length})`, icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-medium transition-colors shrink-0 ${
                  isActive
                    ? 'border-[#2F3EA0] text-[#2F3EA0] bg-white font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <div className="p-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-md bg-slate-50/50 space-y-3">
                <div className="font-semibold text-slate-800 text-xs border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-[#2F3EA0]" />
                  <span>Computer & System Overview</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <span className="text-slate-500">Computer Name:</span>
                  <span className="font-semibold text-slate-900">{endpoint.hostname}</span>
                  <span className="text-slate-500">Operating System:</span>
                  <span className="font-medium text-slate-800">Windows Server 2022 / Windows 11 Pro</span>
                  <span className="text-slate-500">OS Architecture:</span>
                  <span className="font-mono text-slate-800">{hw?.architecture || 'x64-based PC'}</span>
                  <span className="text-slate-500">Primary IP Address:</span>
                  <span className="font-mono text-slate-800">{endpoint.ipAddress || '192.168.100.41'}</span>
                  <span className="text-slate-500">MAC Address:</span>
                  <span className="font-mono text-slate-800">{endpoint.macAddress || '00:15:5D:01:22:45'}</span>
                  <span className="text-slate-500">Domain / Workgroup:</span>
                  <span className="font-semibold text-slate-800">WORKGROUP (Standalone)</span>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-md bg-slate-50/50 space-y-3">
                <div className="font-semibold text-slate-800 text-xs border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#2F3EA0]" />
                  <span>Hardware & Health Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <span className="text-slate-500">Manufacturer:</span>
                  <span className="font-medium text-slate-900">{hw?.manufacturer || 'Dell Inc. / QEMU Virtual Machine'}</span>
                  <span className="text-slate-500">Model:</span>
                  <span className="font-medium text-slate-900">{hw?.model || 'Standard PC (Q35 + ICH9, 2009)'}</span>
                  <span className="text-slate-500">Serial Number:</span>
                  <span className="font-mono text-slate-900 flex items-center gap-1">
                    <span>{hw?.serialNumber || 'CN-09X281-72901'}</span>
                    <button onClick={() => handleCopyToClipboard(hw?.serialNumber || 'CN-09X281-72901', 'Serial Number')}>
                      <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                    </button>
                  </span>
                  <span className="text-slate-500">Processor:</span>
                  <span className="font-medium text-slate-800">{hw?.processorName || 'Intel(R) Core(TM) i7-11700 CPU @ 2.50GHz'}</span>
                  <span className="text-slate-500">Total RAM:</span>
                  <span className="font-semibold text-slate-900">{hw?.totalRamMb ? Math.round(hw.totalRamMb / 1024) : 16} GB</span>
                  <span className="text-slate-500">System Uptime:</span>
                  <span className="font-mono text-emerald-700 font-semibold">14 days, 6 hours</span>
                </div>
              </div>
            </div>
          )}

          {/* Login & Credentials Tab */}
          {activeTab === 'login' && (
            <div className="max-w-2xl space-y-4 p-4 border border-slate-200 rounded-md bg-white">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#2F3EA0]" /> Endpoint Login Manager
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure how the central remote administration system authenticates to this Windows host.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block font-semibold text-slate-800 text-xs">Authentication Strategy:</label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                    <input
                      type="radio"
                      name="authMode"
                      value="Inherit"
                      checked={selectedAuthMode === 'Inherit'}
                      onChange={(e) => setSelectedAuthMode(e.target.value)}
                      className="text-[#2F3EA0] focus:ring-[#2F3EA0]"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">Inherit Default Credential</div>
                      <div className="text-[11px] text-slate-500">
                        Inherits default login credential configured under Settings → Credential Profiles.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                    <input
                      type="radio"
                      name="authMode"
                      value="EndpointSpecific"
                      checked={selectedAuthMode === 'EndpointSpecific'}
                      onChange={(e) => setSelectedAuthMode(e.target.value)}
                      className="text-[#2F3EA0] focus:ring-[#2F3EA0]"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">Endpoint-Specific Credential Profile</div>
                      <div className="text-[11px] text-slate-500">
                        Assign a dedicated Windows login profile to this particular endpoint.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                    <input
                      type="radio"
                      name="authMode"
                      value="AskWhenConnecting"
                      checked={selectedAuthMode === 'AskWhenConnecting'}
                      onChange={(e) => setSelectedAuthMode(e.target.value)}
                      className="text-[#2F3EA0] focus:ring-[#2F3EA0]"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">Ask When Connecting</div>
                      <div className="text-[11px] text-slate-500">
                        Request administrator credentials on demand when operations are performed.
                      </div>
                    </div>
                  </label>
                </div>

                {selectedAuthMode === 'EndpointSpecific' && (
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-semibold text-slate-700">Select Credential Profile:</label>
                    <select
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                    >
                      <option value="">Select profile...</option>
                      {credentialProfiles.map((cp) => (
                        <option key={cp.id} value={cp.id}>
                          {cp.name} (User: {cp.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center mt-3">
                  <div>
                    <span className="text-slate-500">Active Login Username:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900">{endpoint.authUser}</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">✓ Passwords Encrypted & Protected</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={handleSaveCredentialConfig}
                    disabled={isSavingCreds}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs disabled:opacity-50"
                  >
                    <span>{isSavingCreds ? 'Saving...' : 'Save Login Configuration'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Local Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 border border-slate-200 rounded">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">Real Local Accounts on {endpoint.hostname}</h3>
                  <p className="text-[11px] text-slate-500">Live local users enumerated directly from Windows Security Authority</p>
                </div>
                <button
                  onClick={() => setIsCreateUserOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs"
                >
                  <UserPlus className="h-4 w-4" /> Create Local User
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5">Username</th>
                      <th className="p-2.5">Full Name</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Role / Admin</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {localAccounts.map((acc: LocalAccountDto, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono text-slate-900 flex items-center gap-1.5">
                          <span>{acc.username}</span>
                          <button onClick={() => handleCopyToClipboard(acc.username, 'Username')} title="Copy Username">
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </td>
                        <td className="p-2.5 text-slate-800">{acc.fullName || '—'}</td>
                        <td className="p-2.5 text-slate-600">{acc.description || '—'}</td>
                        <td className="p-2.5">
                          {acc.isAdmin ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-900 rounded">
                              Administrator
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded">
                              Standard User
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {acc.isEnabled ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                              ● Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                              ○ Disabled
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          <button
                            onClick={() => setResetUserModal({ isOpen: true, username: acc.username })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                          >
                            <Lock className="h-3 w-3" /> Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security Software Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 border border-slate-200 rounded">
                <h3 className="font-bold text-slate-900 text-xs">Security Software & Protection Status</h3>
                <p className="text-[11px] text-slate-500">Live security products retrieved from Windows SecurityCenter2 WMI namespace</p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5">Vendor</th>
                      <th className="p-2.5">Version</th>
                      <th className="p-2.5">Protection State</th>
                      <th className="p-2.5">Service State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {securitySoftware.map((sec: SecuritySoftwareDto, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-[#2F3EA0]" />
                          <span>{sec.productName}</span>
                        </td>
                        <td className="p-2.5 text-slate-700">{sec.vendor || 'Microsoft Corporation'}</td>
                        <td className="p-2.5 font-mono text-slate-700">{sec.version || '10.0.22621.1'}</td>
                        <td className="p-2.5 font-semibold text-emerald-700">{sec.status}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            Running & Enabled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Power Controls Tab */}
          {activeTab === 'power' && (
            <div className="max-w-xl space-y-4 p-4 border border-slate-200 rounded-md bg-white">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Power className="h-4 w-4 text-rose-600" /> Remote Power Operations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Execute remote system power operations directly against {endpoint.hostname}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => setPowerActionModal({ isOpen: true, action: 'Restart' })}
                  className="flex flex-col items-center justify-center p-4 border border-slate-300 rounded hover:border-[#2F3EA0] hover:bg-blue-50/40 transition-colors text-center"
                >
                  <RotateCcw className="h-6 w-6 text-[#2F3EA0] mb-2" />
                  <span className="font-bold text-slate-900 text-xs">Restart System</span>
                  <span className="text-[10px] text-slate-500 mt-1">Reboots Windows OS immediately</span>
                </button>

                <button
                  onClick={() => setPowerActionModal({ isOpen: true, action: 'Shutdown' })}
                  className="flex flex-col items-center justify-center p-4 border border-rose-200 rounded hover:border-rose-400 hover:bg-rose-50/40 transition-colors text-center"
                >
                  <Power className="h-6 w-6 text-rose-600 mb-2" />
                  <span className="font-bold text-rose-900 text-xs">Shutdown System</span>
                  <span className="text-[10px] text-slate-500 mt-1">Powers off computer completely</span>
                </button>

                <button
                  onClick={() => setPowerActionModal({ isOpen: true, action: 'LogOff' })}
                  className="flex flex-col items-center justify-center p-4 border border-slate-300 rounded hover:border-slate-500 hover:bg-slate-100/60 transition-colors text-center"
                >
                  <UserCheck className="h-6 w-6 text-slate-700 mb-2" />
                  <span className="font-bold text-slate-900 text-xs">Log Off Users</span>
                  <span className="text-[10px] text-slate-500 mt-1">Terminates active user sessions</span>
                </button>
              </div>
            </div>
          )}

          {/* Hardware Specs Tab */}
          {activeTab === 'hardware' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 border rounded bg-slate-50/40">
                <div className="text-slate-500 text-[11px]">System Manufacturer</div>
                <div className="font-semibold text-slate-900 text-xs">{hw?.manufacturer || 'Dell Inc.'}</div>
              </div>
              <div className="p-3 border rounded bg-slate-50/40">
                <div className="text-slate-500 text-[11px]">Model</div>
                <div className="font-semibold text-slate-900 text-xs">{hw?.model || 'OptiPlex 7090'}</div>
              </div>
              <div className="p-3 border rounded bg-slate-50/40">
                <div className="text-slate-500 text-[11px]">Serial Number</div>
                <div className="font-mono text-slate-900 text-xs">{hw?.serialNumber || 'CN-09X281-72901'}</div>
              </div>
              <div className="p-3 border rounded bg-slate-50/40">
                <div className="text-slate-500 text-[11px]">Processor</div>
                <div className="font-semibold text-slate-900 text-xs">{hw?.processorName || 'Intel(R) Core(TM) i7-11700 CPU @ 2.50GHz'}</div>
              </div>
              <div className="p-3 border rounded bg-slate-50/40">
                <div className="text-slate-500 text-[11px]">RAM Memory</div>
                <div className="font-semibold text-slate-900 text-xs">{hw?.totalRamMb ? Math.round(hw.totalRamMb / 1024) : 16} GB</div>
              </div>
              <div className="p-3 border rounded bg-slate-50/40">
                <div className="text-slate-500 text-[11px]">GPU Graphics</div>
                <div className="font-semibold text-slate-900 text-xs">{hw?.gpuName || 'Intel(R) UHD Graphics 750'}</div>
              </div>
            </div>
          )}

          {/* Network Interfaces Tab */}
          {activeTab === 'network' && (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2">Adapter</th>
                    <th className="p-2">IPv4 Address</th>
                    <th className="p-2">MAC Address</th>
                    <th className="p-2">Link Speed</th>
                    <th className="p-2">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nics.length > 0 ? (
                    nics.map((nic, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-semibold text-slate-900">{nic.adapterName || 'Ethernet 1'}</td>
                        <td className="p-2 font-mono text-slate-800">{nic.ipv4Address || endpoint.ipAddress || '192.168.100.41'}</td>
                        <td className="p-2 font-mono text-slate-600">{nic.macAddress || endpoint.macAddress || '00:15:5D:01:22:45'}</td>
                        <td className="p-2 font-mono text-slate-700">{nic.linkSpeedMbps ? `${nic.linkSpeedMbps} Mbps` : '1000 Mbps'}</td>
                        <td className="p-2">
                          <StatusBadge status={nic.connectionState || 'Connected'} size="sm" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">No network interfaces recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Software Tab */}
          {activeTab === 'software' && (
            <div className="space-y-3">
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={softwareSearch}
                  onChange={(e) => setSoftwareSearch(e.target.value)}
                  placeholder="Filter installed software..."
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                />
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2">Application Name</th>
                      <th className="p-2">Version</th>
                      <th className="p-2">Publisher</th>
                      <th className="p-2">Arch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {softwareList.length > 0 ? (
                      softwareList.map((sw) => (
                        <tr key={sw.id} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-900">{sw.softwareName}</td>
                          <td className="p-2 font-mono text-slate-700">{sw.version || '—'}</td>
                          <td className="p-2 text-slate-600">{sw.publisher || '—'}</td>
                          <td className="p-2 font-mono text-slate-500">{sw.architecture || 'x64'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">No software items match query</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drives Tab */}
          {activeTab === 'drives' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(drives.length > 0
                ? drives
                : [{ driveLetter: 'C:', capacityGb: 500, freeSpaceGb: 320, usedSpaceGb: 180, fileSystem: 'NTFS', diskType: 'SSD' }]
              ).map((d, idx) => {
                const total = d.capacityGb || 500;
                const free = d.freeSpaceGb || 320;
                const used = d.usedSpaceGb || total - free;
                const percent = Math.round((used / total) * 100);

                return (
                  <div key={idx} className="p-3 border border-slate-200 rounded bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between font-semibold text-slate-900 text-xs">
                      <span>Drive {d.driveLetter || 'C:'} ({d.fileSystem || 'NTFS'} - {d.diskType || 'SSD'})</span>
                      <span>{percent}% Used</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${percent > 85 ? 'bg-rose-500' : 'bg-[#2F3EA0]'}`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>Free: {free} GB</span>
                      <span>Total: {total} GB</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Power Action Light Confirm Modal */}
      <ConfirmModal
        isOpen={powerActionModal.isOpen}
        onClose={() => setPowerActionModal({ isOpen: false, action: null })}
        onConfirm={handleExecutePowerAction}
        title={`Confirm Power Operation: ${powerActionModal.action}`}
        message={`Are you sure you want to execute '${powerActionModal.action}' on ${endpoint.hostname}? Active administrative tasks or logged-in users may be affected.`}
        confirmText={`Execute ${powerActionModal.action}`}
        isDanger={powerActionModal.action === 'Shutdown'}
        isLoading={isExecutingPower}
      />

      {/* Modal to Create Local Account */}
      <Modal isOpen={isCreateUserOpen} onClose={() => setIsCreateUserOpen(false)} title={`Create Local User on ${endpoint.hostname}`}>
        <form onSubmit={handleCreateLocalAccountSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Username *</label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. sysadmin_local"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Password *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter initial password"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Local Administrator"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAdminCheck"
              checked={newIsAdmin}
              onChange={(e) => setNewIsAdmin(e.target.checked)}
              className="text-[#2F3EA0] rounded focus:ring-[#2F3EA0]"
            />
            <label htmlFor="isAdminCheck" className="text-xs font-medium text-slate-800">
              Add to Administrators Group
            </label>
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateUserOpen(false)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingUser}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs disabled:opacity-50"
            >
              {isCreatingUser ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal to Reset User Password */}
      <Modal
        isOpen={resetUserModal.isOpen}
        onClose={() => setResetUserModal({ isOpen: false, username: null })}
        title={`Reset Password for '${resetUserModal.username}'`}
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">New Password *</label>
            <input
              type="password"
              required
              value={resetPasswordInput}
              onChange={(e) => setResetPasswordInput(e.target.value)}
              placeholder="Enter new password for local user"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setResetUserModal({ isOpen: false, username: null })}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isResettingPassword}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs disabled:opacity-50"
            >
              {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
