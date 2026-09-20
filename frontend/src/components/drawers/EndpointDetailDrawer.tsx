import React, { useState, useEffect } from 'react';
import { useEndpointDetail } from '../../hooks/useEndpoints';
import { endpointsApi } from '../../api/endpointsApi';
import { fetchCredentials, type CredentialProfileItem } from '../../api/credentialsApi';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ConfirmModal } from '../common/ConfirmModal';
import { Modal } from '../common/Modal';
import { DeviceIcon } from '../common/DeviceIcon';
import { toast } from '../../store/useToastStore';
import type { EndpointDetailDto } from '../../types/api';
import { licensingApi, type ActivationRecordItem } from '../../api/licensingApi';
import {
  X,
  Monitor,
  Cpu,
  Network,
  HardDrive,
  Package,
  Power,
  UserCheck,
  UserPlus,
  Key,
  Shield,
  RefreshCw,
  AlertTriangle,
  KeyRound,
  Building2,
} from 'lucide-react';

interface EndpointDetailDrawerProps {
  endpointId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EndpointDetailDrawer: React.FC<EndpointDetailDrawerProps> = ({
  endpointId,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'licensing' | 'login' | 'accounts' | 'security' | 'power' | 'network' | 'software' | 'drives'
  >('overview');

  const [licensingData, setLicensingData] = useState<{ windows: ActivationRecordItem | null; office: ActivationRecordItem | null } | null>(null);
  const [isLoadingLicensing, setIsLoadingLicensing] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [kmsConfigModalOpen, setKmsConfigModalOpen] = useState(false);
  const [kmsHostnameInput, setKmsHostnameInput] = useState('');

  const [softwareSearch] = useState('');

  const [credentialProfiles, setCredentialProfiles] = useState<CredentialProfileItem[]>([]);
  const [selectedAuthMode, setSelectedAuthMode] = useState<string>('Inherit');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  const [powerActionModal, setPowerActionModal] = useState<{ isOpen: boolean; action: string | null }>({
    isOpen: false,
    action: null,
  });
  const [isExecutingPower, setIsExecutingPower] = useState(false);

  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [resetUserModal, setResetUserModal] = useState<{ isOpen: boolean; username: string | null }>({
    isOpen: false,
    username: null,
  });
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const { data: response, isLoading, isError, refetch } = useEndpointDetail(endpointId || '');

  const rawData: any = response;
  const endpoint: EndpointDetailDto | undefined = rawData?.data ?? (rawData?.id ? rawData : undefined);

  useEffect(() => {
    if (isOpen) {
      fetchCredentials()
        .then((data) => setCredentialProfiles(data || []))
        .catch(() => setCredentialProfiles([]));
    }
  }, [isOpen]);

  const loadLicensingData = async () => {
    if (!endpointId) return;
    setIsLoadingLicensing(true);
    try {
      const data = await licensingApi.getEndpointActivation(endpointId);
      setLicensingData(data);
    } catch {
      setLicensingData(null);
    } finally {
      setIsLoadingLicensing(false);
    }
  };

  useEffect(() => {
    if (isOpen && endpointId && activeTab === 'licensing') {
      loadLicensingData();
    }
  }, [isOpen, endpointId, activeTab]);

  useEffect(() => {
    if (endpoint) {
      setSelectedAuthMode(endpoint.authMode || 'Inherit');
      setSelectedProfileId(endpoint.credentialProfileId || '');
    }
  }, [endpoint]);

  const handleCheckActivation = async () => {
    if (!endpointId) return;
    setIsActivating(true);
    try {
      toast.info('Dispatching Licensing Check Job...', `Checking Windows & Office activation on endpoint`);
      await licensingApi.triggerActivationCheck(endpointId);
      toast.success('Activation Check Dispatched', 'Agent job queued successfully.');
      loadLicensingData();
    } catch (err: any) {
      toast.error('Check Failed', err?.message || 'Failed to dispatch activation check');
    } finally {
      setIsActivating(false);
    }
  };

  const handleConfigureKmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endpointId || !kmsHostnameInput.trim()) return;
    try {
      await licensingApi.configureKmsClient(endpointId, kmsHostnameInput.trim());
      toast.success('KMS Host Configured', `KMS Client host set to '${kmsHostnameInput}'`);
      setKmsConfigModalOpen(false);
      setKmsHostnameInput('');
      loadLicensingData();
    } catch (err: any) {
      toast.error('Configuration Failed', err?.message || 'Failed to configure KMS host');
    }
  };

  if (!isOpen || !endpointId) return null;

  const hw = endpoint?.hardware;
  const nics = endpoint?.networkInterfaces || [];
  const drives = endpoint?.drives || [];
  const softwareList = (endpoint?.software || []).filter((s: any) =>
    (s?.softwareName || '').toLowerCase().includes((softwareSearch || '').toLowerCase())
  );
  const localAccounts = endpoint?.localAccounts || [];
  const securitySoftware = endpoint?.securitySoftware || [];

  const isOnline = (endpoint?.status || '').toLowerCase() === 'online';

  const handleSaveCredentialConfig = async () => {
    if (!endpoint) return;
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

  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const handleCheckConnection = async () => {
    if (!endpoint) return;
    setIsCheckingConnection(true);
    try {
      toast.info('Authenticating Remote Host...', `Testing WMI connectivity & live queries on ${endpoint.hostname}`);
      const res = await endpointsApi.checkConnection(endpoint.id);
      if (res.success) {
        toast.success('Endpoint Authorized & Queried', res.message || 'Live system data updated.');
      } else {
        toast.error('Connection Check Failed', res.message || 'Remote WMI query failed.');
      }
      await refetch();
    } catch (err: any) {
      toast.error('Check Failed', err?.response?.data?.message || 'Connection check failed');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleExecutePowerAction = async () => {
    if (!endpoint || !powerActionModal.action) return;
    setIsExecutingPower(true);
    try {
      const res = await endpointsApi.powerControl(endpoint.id, powerActionModal.action);
      if (res.success) {
        toast.success('Power Action Dispatched', res.message || `Command '${powerActionModal.action}' sent to ${endpoint.hostname}`);
      } else {
        toast.error('Power Control Failed', res.message || 'Execution failed');
      }
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
    if (!endpoint || !newUsername.trim() || !newPassword) return;
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
    if (!endpoint || !resetUserModal.username || !resetPasswordInput) return;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end font-sans text-xs">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DeviceIcon deviceType={endpoint?.deviceType || 'Windows'} size={24} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{endpoint?.hostname || 'Endpoint Details'}</h2>
                {endpoint && <StatusBadge status={endpoint.status} size="sm" />}
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                IP: {endpoint?.ipAddress || '—'} | FQDN: {endpoint?.fqdn || '—'} | User: {endpoint?.authUser || 'None'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {endpoint && (
              <button
                onClick={handleCheckConnection}
                disabled={isCheckingConnection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#2F3EA0] ${isCheckingConnection ? 'animate-spin' : ''}`} />
                {isCheckingConnection ? 'Authenticating WMI...' : 'Check Connection & Authenticate'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="p-6">
            <LoadingSkeleton rows={8} />
          </div>
        )}

        {isError && (
          <div className="p-6 text-center text-rose-700 space-y-2">
            <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto" />
            <p className="font-semibold">Unable to fetch endpoint details from server.</p>
            <button onClick={() => refetch()} className="px-3 py-1 bg-slate-100 border rounded text-slate-800">Retry</button>
          </div>
        )}

        {!isLoading && !isError && endpoint && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 overflow-x-auto rounded-t-md">
              {[
                { id: 'overview', label: 'Overview', icon: Monitor },
                { id: 'licensing', label: 'Licensing & KMS', icon: KeyRound },
                { id: 'login', label: 'Login & Credentials', icon: Key },
                { id: 'accounts', label: `Local Accounts (${localAccounts.length})`, icon: UserCheck },
                { id: 'security', label: `Security Software (${securitySoftware.length})`, icon: Shield },
                { id: 'power', label: 'Power Controls', icon: Power },
                { id: 'network', label: `Network Interfaces (${nics.length})`, icon: Network },
                { id: 'software', label: `Apps (${softwareList.length})`, icon: Package },
                { id: 'drives', label: `Storage (${drives.length})`, icon: HardDrive },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 font-medium transition-colors shrink-0 cursor-pointer ${
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

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-2.5">
                  <h4 className="font-bold text-slate-800 border-b pb-1 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-[#2F3EA0]" /> Computer & System
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-slate-500">Computer Hostname:</span>
                    <span className="font-semibold text-slate-900">{endpoint.hostname}</span>
                    <span className="text-slate-500">Operating System:</span>
                    <span className="font-medium text-slate-800">{endpoint.deviceType === 'Windows' ? 'Windows Server / Workstation' : endpoint.deviceType}</span>
                    <span className="text-slate-500">IP Address:</span>
                    <span className="font-mono">{endpoint.ipAddress || 'Unavailable'}</span>
                    <span className="text-slate-500">MAC Address:</span>
                    <span className="font-mono">{endpoint.macAddress || 'Unavailable'}</span>
                    <span className="text-slate-500">Domain / Workgroup:</span>
                    <span className="font-semibold">{endpoint.domainWorkgroup || 'WORKGROUP'}</span>
                    <span className="text-slate-500">Interactive User:</span>
                    <span className="font-mono text-blue-900 font-semibold">{endpoint.currentInteractiveUser || 'No interactive user'}</span>
                    <span className="text-slate-500">Auth User:</span>
                    <span className="font-mono text-slate-800">{endpoint.authUser || 'No credential configured'}</span>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-2.5">
                  <h4 className="font-bold text-slate-800 border-b pb-1 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#2F3EA0]" /> Hardware & System Health
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-slate-500">Manufacturer:</span>
                    <span className="font-medium">{hw?.manufacturer || 'Unavailable'}</span>
                    <span className="text-slate-500">Model:</span>
                    <span className="font-medium">{hw?.model || 'Unavailable'}</span>
                    <span className="text-slate-500">Serial Number:</span>
                    <span className="font-mono">{hw?.serialNumber || 'Unavailable'}</span>
                    <span className="text-slate-500">Processor:</span>
                    <span className="font-medium">{hw?.processorName || 'Unavailable'}</span>
                    <span className="text-slate-500">RAM Memory:</span>
                    <span className="font-semibold">{hw?.totalRamMb ? `${Math.round(hw.totalRamMb / 1024)} GB` : 'Unavailable'}</span>
                    <span className="text-slate-500">System Uptime:</span>
                    <span className="font-mono text-emerald-700 font-semibold">{endpoint.systemUptime || 'Unavailable'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'licensing' && (
              <div className="space-y-4">
                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-[#2F3EA0]" />
                    <span className="font-bold text-slate-900">Microsoft Volume Licensing Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCheckActivation}
                      disabled={isActivating}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-[#2F3EA0] ${isActivating ? 'animate-spin' : ''}`} />
                      Check Activation
                    </button>
                    <button
                      onClick={() => setKmsConfigModalOpen(true)}
                      className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold hover:bg-[#253285] flex items-center gap-1 cursor-pointer"
                    >
                      Configure KMS Host
                    </button>
                  </div>
                </div>

                {isLoadingLicensing && <LoadingSkeleton rows={4} />}

                {!isLoadingLicensing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Windows License */}
                    <div className="p-4 border rounded bg-white space-y-2.5 shadow-xs">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-[#2F3EA0]" /> Windows Operating System
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          licensingData?.windows?.activationStatus === 'Activated' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {licensingData?.windows?.activationStatus || 'Unknown'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <span className="text-slate-500">Edition:</span>
                        <span className="font-semibold text-slate-800">{licensingData?.windows?.edition || 'Windows 10/11 Enterprise'}</span>
                        <span className="text-slate-500">Channel:</span>
                        <span className="font-medium text-slate-700">{licensingData?.windows?.channel || 'VOLUME_KMSCLIENT'}</span>
                        <span className="text-slate-500">KMS Host:</span>
                        <span className="font-mono text-blue-900 font-semibold">{licensingData?.windows?.kmsHostAddress || 'DNS Auto-Discovery'}</span>
                        <span className="text-slate-500">Partial Key:</span>
                        <span className="font-mono">{licensingData?.windows?.partialProductKey || '*****'}</span>
                        <span className="text-slate-500">Last Checked:</span>
                        <span className="text-slate-600">{licensingData?.windows?.lastCheckedAt ? new Date(licensingData.windows.lastCheckedAt).toLocaleString() : 'Never'}</span>
                      </div>
                    </div>

                    {/* Office License */}
                    <div className="p-4 border rounded bg-white space-y-2.5 shadow-xs">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-purple-600" /> Microsoft Office
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          licensingData?.office?.activationStatus === 'Activated' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {licensingData?.office?.activationStatus || 'Unknown'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <span className="text-slate-500">Product:</span>
                        <span className="font-semibold text-slate-800">{licensingData?.office?.edition || 'Office LTSC 2024'}</span>
                        <span className="text-slate-500">Activation Type:</span>
                        <span className="font-medium text-slate-700">{licensingData?.office?.activationType || 'KMS'}</span>
                        <span className="text-slate-500">KMS Host:</span>
                        <span className="font-mono text-purple-900 font-semibold">{licensingData?.office?.kmsHostAddress || 'DNS Auto-Discovery'}</span>
                        <span className="text-slate-500">Partial Key:</span>
                        <span className="font-mono">{licensingData?.office?.partialProductKey || '*****'}</span>
                        <span className="text-slate-500">Last Checked:</span>
                        <span className="text-slate-600">{licensingData?.office?.lastCheckedAt ? new Date(licensingData.office.lastCheckedAt).toLocaleString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'login' && (
              <div className="space-y-4 p-4 border border-slate-200 rounded bg-white max-w-xl">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#2F3EA0]" /> Credential Configuration
                </h3>
                <div className="space-y-2">
                  {['Inherit', 'EndpointSpecific', 'AskWhenConnecting'].map((mode) => (
                    <label key={mode} className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="drawerAuthMode"
                        value={mode}
                        checked={selectedAuthMode === mode}
                        onChange={(e) => setSelectedAuthMode(e.target.value)}
                        className="text-[#2F3EA0]"
                      />
                      <span className="font-semibold text-slate-800">{mode}</span>
                    </label>
                  ))}
                </div>
                {selectedAuthMode === 'EndpointSpecific' && (
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="w-full p-2 border rounded text-xs"
                  >
                    <option value="">Select profile...</option>
                    {credentialProfiles.map((cp) => (
                      <option key={cp.id} value={cp.id}>{cp.name} ({cp.username})</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={handleSaveCredentialConfig}
                  disabled={isSavingCreds}
                  className="px-4 py-2 bg-[#2F3EA0] text-white font-semibold rounded text-xs cursor-pointer"
                >
                  {isSavingCreds ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            )}

            {activeTab === 'accounts' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 border rounded">
                  <span className="font-bold text-slate-900">Local Users on {endpoint.hostname}</span>
                  <button onClick={() => setIsCreateUserOpen(true)} className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    <UserPlus className="h-3.5 w-3.5" /> Create Local User
                  </button>
                </div>
                <table className="w-full text-left text-xs border">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-2">Username</th>
                      <th className="p-2">Full Name</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {localAccounts.map((acc: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold font-mono">{acc.username}</td>
                        <td className="p-2">{acc.fullName || '—'}</td>
                        <td className="p-2">{acc.isAdmin ? 'Admin' : 'Standard'}</td>
                        <td className="p-2">
                          <button onClick={() => setResetUserModal({ isOpen: true, username: acc.username })} className="px-2 py-0.5 bg-slate-100 border rounded text-[11px] cursor-pointer">
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-3">
                <div className="bg-slate-50 p-2.5 border rounded font-bold text-slate-900">Security Software State</div>
                <table className="w-full text-left text-xs border">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-2">Product</th>
                      <th className="p-2">Vendor</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {securitySoftware.map((sec: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 font-semibold">{sec.productName}</td>
                        <td className="p-2">{sec.vendor || 'Microsoft'}</td>
                        <td className="p-2 text-emerald-700 font-semibold">{sec.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'power' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Restart', 'Shutdown', 'LogOff', 'PowerOn'].map((act) => (
                  <button
                    key={act}
                    onClick={() => setPowerActionModal({ isOpen: true, action: act })}
                    disabled={!isOnline && act !== 'PowerOn'}
                    className="p-3 border rounded text-center font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    {act}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'network' && (
              <table className="w-full text-left text-xs border">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-2">Adapter</th>
                    <th className="p-2">IP Address</th>
                    <th className="p-2">MAC</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {nics.map((nic: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{nic.adapterName}</td>
                      <td className="p-2 font-mono">{nic.ipv4Address || '—'}</td>
                      <td className="p-2 font-mono">{nic.macAddress || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'software' && (
              <table className="w-full text-left text-xs border max-h-64 overflow-y-auto">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-2">Software Name</th>
                    <th className="p-2">Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {softwareList.map((sw: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{sw.softwareName}</td>
                      <td className="p-2 font-mono">{sw.version || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'drives' && (
              <div className="space-y-3">
                {drives.map((d: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded bg-slate-50">
                    <div className="flex justify-between font-bold">
                      <span>Drive {d.driveLetter} ({d.fileSystem})</span>
                      <span>{d.capacityGb} GB Total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <ConfirmModal
          isOpen={powerActionModal.isOpen}
          onClose={() => setPowerActionModal({ isOpen: false, action: null })}
          onConfirm={handleExecutePowerAction}
          title={`Execute Power Action: ${powerActionModal.action}`}
          message={`Are you sure you want to execute '${powerActionModal.action}' on ${endpoint?.hostname}?`}
          confirmText={`Execute ${powerActionModal.action}`}
          isLoading={isExecutingPower}
        />

        {/* Modal: Create Local User */}
        <Modal
          isOpen={isCreateUserOpen}
          onClose={() => setIsCreateUserOpen(false)}
          title={`Create Local Account on ${endpoint?.hostname}`}
        >
          <form onSubmit={handleCreateLocalAccountSubmit} className="space-y-3 font-sans text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Username *</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. ra_admin"
                className="w-full p-2 border rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="e.g. Remote Admin Service Account"
                className="w-full p-2 border rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2 border rounded text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="drawerIsAdmin"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                className="text-[#2F3EA0]"
              />
              <label htmlFor="drawerIsAdmin" className="text-slate-800 font-medium cursor-pointer">
                Grant Local Administrator Rights (Administrators Group)
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(false)}
                className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingUser}
                className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold cursor-pointer disabled:opacity-50"
              >
                {isCreatingUser ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Reset User Password */}
        <Modal
          isOpen={resetUserModal.isOpen}
          onClose={() => setResetUserModal({ isOpen: false, username: null })}
          title={`Reset Password for '${resetUserModal.username}'`}
        >
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3 font-sans text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">New Password *</label>
              <input
                type="password"
                required
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                placeholder="Enter new password"
                className="w-full p-2 border rounded text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setResetUserModal({ isOpen: false, username: null })}
                className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResettingPassword}
                className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold cursor-pointer disabled:opacity-50"
              >
                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </Modal>
        {/* Modal: Configure KMS Host */}
        <Modal
          isOpen={kmsConfigModalOpen}
          onClose={() => setKmsConfigModalOpen(false)}
          title={`Configure KMS Host for ${endpoint?.hostname}`}
        >
          <form onSubmit={handleConfigureKmsSubmit} className="space-y-3 font-sans text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">KMS Hostname / FQDN *</label>
              <input
                type="text"
                required
                value={kmsHostnameInput}
                onChange={(e) => setKmsHostnameInput(e.target.value)}
                placeholder="e.g. kms1.domain.local"
                className="w-full p-2 border rounded font-mono text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setKmsConfigModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold cursor-pointer"
              >
                Save KMS Host
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
