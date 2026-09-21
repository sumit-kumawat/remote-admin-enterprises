import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEndpointDetail, useDeleteEndpoint } from '../../hooks/useEndpoints';
import { endpointsApi } from '../../api/endpointsApi';
import { fetchCredentials, type CredentialProfileItem } from '../../api/credentialsApi';
import type {
  EndpointDetailDto,
  LocalAccountDto,
  SecuritySoftwareDto,
  SoftwareInventoryItemDto,
  NetworkInterfaceDto,
  PhysicalDiskDto,
  StorageDriveDto,
} from '../../types/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
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
  Clock,
  Zap,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export const EndpointDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'login' | 'accounts' | 'security' | 'power' | 'network' | 'software' | 'drives'
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
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Software Install / Uninstall modal state
  const [isUninstallingSw, setIsUninstallingSw] = useState<string | null>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installPackageInput, setInstallPackageInput] = useState('');
  const [installVersionInput, setInstallVersionInput] = useState('');
  const [isInstallingSw, setIsInstallingSw] = useState(false);
  const [isDeleteDetailPageModalOpen, setIsDeleteDetailPageModalOpen] = useState(false);

  const { data: response, isLoading, isError, refetch } = useEndpointDetail(id || '');
  const deleteEndpointMutation = useDeleteEndpoint();

  useEffect(() => {
    fetchCredentials()
      .then((data) => setCredentialProfiles(data || []))
      .catch(() => setCredentialProfiles([]));
  }, []);

  const rawData: any = response;
  const endpoint: EndpointDetailDto | undefined = rawData?.data ?? (rawData?.id ? rawData : undefined);

  useEffect(() => {
    if (endpoint) {
      setSelectedAuthMode(endpoint.authMode || 'Inherit');
      setSelectedProfileId(endpoint.credentialProfileId || '');
    }
  }, [endpoint]);

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError || !endpoint) {
    return (
      <div className="bg-white p-6 border border-slate-200 rounded-md shadow-xs space-y-4 max-w-xl mx-auto my-8 text-center font-sans">
        <div className="inline-flex p-3 bg-amber-100 text-amber-700 rounded-full">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Endpoint Not Found</h2>
        <p className="text-xs text-slate-600">
          The requested endpoint identifier <span className="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-900">{id}</span> could not be found in inventory. It may have been removed or the database was re-initialized.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate('/endpoints')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs cursor-pointer"
          >
            Back to Endpoint Inventory
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded cursor-pointer"
          >
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  const hw = endpoint.hardware;
  const nics: NetworkInterfaceDto[] = endpoint.networkInterfaces || [];
  const drives: StorageDriveDto[] = endpoint.drives || [];
  const physicalDisks: PhysicalDiskDto[] = endpoint.physicalDisks || [];
  const softwareList: SoftwareInventoryItemDto[] = (endpoint.software || []).filter((s: SoftwareInventoryItemDto) =>
    (s?.softwareName || '').toLowerCase().includes((softwareSearch || '').toLowerCase())
  );
  const localAccounts: LocalAccountDto[] = endpoint.localAccounts || [];
  const securitySoftware: SecuritySoftwareDto[] = endpoint.securitySoftware || [];
  const sectionStatuses = endpoint.sectionStatuses || {};

  const isOnline = (endpoint.status || '').toLowerCase() === 'online';
  const hasMacAddress = Boolean(endpoint.macAddress && endpoint.macAddress.trim().length > 0);

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
    if (!powerActionModal.action) return;
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

  const handleUninstallSoftware = async (softwareName: string) => {
    setIsUninstallingSw(softwareName);
    try {
      toast.info('Dispatching Uninstallation...', `Uninstalling '${softwareName}' on ${endpoint.hostname}`);
      const res = await endpointsApi.uninstallSoftware(endpoint.id, softwareName);
      if (res.success) {
        toast.success('Software Uninstalled', res.message || `'${softwareName}' uninstallation command sent to ${endpoint.hostname}.`);
        refetch();
      } else {
        toast.error('Uninstallation Failed', res.message || 'Operation failed.');
      }
    } catch (err: any) {
      toast.error('Uninstall Failed', err?.response?.data?.message || err?.message || 'Failed to uninstall software');
    } finally {
      setIsUninstallingSw(null);
    }
  };

  const handleInstallSoftwareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installPackageInput.trim()) return;
    setIsInstallingSw(true);
    try {
      toast.info('Dispatching Remote Installation...', `Installing '${installPackageInput.trim()}' on ${endpoint.hostname}`);
      const res = await endpointsApi.installSoftware(endpoint.id, installPackageInput.trim(), installVersionInput.trim() || undefined);
      if (res.success) {
        toast.success('Software Installation Dispatched', res.message || `Installation of '${installPackageInput}' started on ${endpoint.hostname}.`);
        setInstallModalOpen(false);
        setInstallPackageInput('');
        setInstallVersionInput('');
        refetch();
      } else {
        toast.error('Installation Failed', res.message || 'Operation failed.');
      }
    } catch (err: any) {
      toast.error('Install Failed', err?.response?.data?.message || err?.message || 'Failed to install software package');
    } finally {
      setIsInstallingSw(false);
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
              disabled={isCheckingConnection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#2F3EA0] ${isCheckingConnection ? 'animate-spin' : ''}`} />
              {isCheckingConnection ? 'Authenticating WMI...' : 'Check Connection & Authenticate'}
            </button>
            <button
              onClick={() => setPowerActionModal({ isOpen: true, action: 'Restart' })}
              disabled={!isOnline}
              title={!isOnline ? 'Endpoint is Offline. Restart unavailable.' : 'Restart System'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restart Endpoint
            </button>
            <button
              onClick={() => setPowerActionModal({ isOpen: true, action: 'Shutdown' })}
              disabled={!isOnline}
              title={!isOnline ? 'Endpoint is Offline. Shutdown unavailable.' : 'Shutdown System'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Power className="h-3.5 w-3.5" /> Shutdown
            </button>
            {!isOnline && (
              <button
                onClick={() => setPowerActionModal({ isOpen: true, action: 'PowerOn' })}
                disabled={!hasMacAddress}
                title={!hasMacAddress ? 'Wake-on-LAN requires a valid MAC address' : 'Send Wake-on-LAN magic packet'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap className="h-3.5 w-3.5 text-amber-700" /> Power On (WOL)
              </button>
            )}
            <button
              onClick={() => setIsDeleteDetailPageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded shadow-xs cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete Endpoint
            </button>
          </div>
        </div>

        {isCheckingConnection && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 flex items-center gap-3 text-indigo-900 animate-pulse shadow-xs">
            <RefreshCw className="h-4 w-4 animate-spin text-[#2F3EA0]" />
            <div className="flex-1">
              <div className="font-bold text-xs flex items-center justify-between">
                <span>Realtime Remote WMI Authentication & Live Query In Progress...</span>
                <span className="text-[11px] text-indigo-700 font-mono">{endpoint.ipAddress || endpoint.hostname} : WMI/RPC</span>
              </div>
              <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-[#2F3EA0] h-full rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          </div>
        )}

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
              {endpoint.authStatus === 'Pending Authorization' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                  <Clock className="h-3 w-3" /> Pending Authorization
                </span>
              )}
              {endpoint.authStatus !== 'Authorized' && endpoint.authStatus !== 'Pending Authorization' && (
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
                Auth User: <span className="bg-slate-100 px-1.5 py-0.5 rounded border">{endpoint.authUser || 'No credential configured'}</span>
              </span>
              <span className="text-slate-700 font-semibold font-sans">
                Interactive User: <span className="bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded border border-blue-200">{endpoint.currentInteractiveUser || 'No interactive user'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar (Hardware Specs tab removed and merged into System Overview) */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 overflow-x-auto">
          {[
            { id: 'overview', label: 'System Overview', icon: Monitor },
            { id: 'login', label: 'Login & Credentials', icon: Key },
            { id: 'accounts', label: `Local Accounts (${localAccounts.length})`, icon: UserCheck },
            { id: 'security', label: `Security Software (${securitySoftware.length})`, icon: Shield },
            { id: 'power', label: 'Power Controls', icon: Power },
            { id: 'network', label: `Network Interfaces (${nics.length})`, icon: Network },
            { id: 'software', label: `Installed Apps (${endpoint.software?.length || 0})`, icon: Package },
            { id: 'drives', label: `Storage & Disks (${drives.length})`, icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-medium transition-colors shrink-0 cursor-pointer ${
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
          {/* Overview Tab (Includes Hardware Specifications) */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Computer & System Overview */}
                <div className="p-4 border border-slate-200 rounded-md bg-slate-50/50 space-y-3">
                  <div className="font-semibold text-slate-800 text-xs border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-[#2F3EA0]" />
                      <span>Computer & System Overview</span>
                    </div>
                    {endpoint.lastSuccessfulRefresh && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Last Live Query: {new Date(endpoint.lastSuccessfulRefresh).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <span className="text-slate-500">Computer Hostname:</span>
                    <span className="font-semibold text-slate-900">{endpoint.hostname}</span>
                    <span className="text-slate-500">Operating System:</span>
                    <span className="font-medium text-slate-800">{endpoint.deviceType === 'Windows' ? 'Windows Server / Workstation' : endpoint.deviceType}</span>
                    <span className="text-slate-500">OS Architecture:</span>
                    <span className="font-mono text-slate-800">{hw?.architecture || 'Unavailable'}</span>
                    <span className="text-slate-500">Primary IP Address:</span>
                    <span className="font-mono text-slate-800">{endpoint.ipAddress || 'Unavailable'}</span>
                    <span className="text-slate-500">MAC Address:</span>
                    <span className="font-mono text-slate-800">{endpoint.macAddress || 'Unavailable'}</span>
                    <span className="text-slate-500">Domain / Workgroup:</span>
                    <span className="font-semibold text-slate-800">{endpoint.domainWorkgroup || 'Unavailable'}</span>
                    <span className="text-slate-500">Current Interactive User:</span>
                    <span className="font-mono text-blue-900 font-semibold">{endpoint.currentInteractiveUser || 'No interactive user'}</span>
                    <span className="text-slate-500">Remote Authentication User:</span>
                    <span className="font-mono text-slate-800">{endpoint.authUser || 'No credential configured'}</span>
                  </div>
                </div>

                {/* Hardware & Health Summary */}
                <div className="p-4 border border-slate-200 rounded-md bg-slate-50/50 space-y-3">
                  <div className="font-semibold text-slate-800 text-xs border-b border-slate-200 pb-1.5 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#2F3EA0]" />
                    <span>Hardware Specifications & Health</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <span className="text-slate-500">System Manufacturer:</span>
                    <span className="font-medium text-slate-900">{hw?.manufacturer || 'Unavailable'}</span>
                    <span className="text-slate-500">Model:</span>
                    <span className="font-medium text-slate-900">{hw?.model || 'Unavailable'}</span>
                    <span className="text-slate-500">Serial Number:</span>
                    <span className="font-mono text-slate-900 flex items-center gap-1">
                      <span>{hw?.serialNumber || 'Unavailable'}</span>
                      {hw?.serialNumber && (
                        <button onClick={() => handleCopyToClipboard(hw.serialNumber!, 'Serial Number')}>
                          <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                        </button>
                      )}
                    </span>
                    <span className="text-slate-500">Processor:</span>
                    <span className="font-medium text-slate-800">{hw?.processorName || 'Unavailable'}</span>
                    <span className="text-slate-500">CPU Cores / Threads:</span>
                    <span className="font-mono text-slate-800">{hw?.cores ? `${hw.cores} cores / ${hw.logicalProcessors || hw.cores} threads` : 'Unavailable'}</span>
                    <span className="text-slate-500">Total RAM Memory:</span>
                    <span className="font-semibold text-slate-900">{hw?.totalRamMb ? `${Math.round(hw.totalRamMb / 1024)} GB` : 'Unavailable'}</span>
                    <span className="text-slate-500">System Uptime:</span>
                    <span className="font-mono text-emerald-700 font-semibold">{endpoint.systemUptime || 'Unavailable'}</span>
                  </div>
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
                      <div className="font-semibold text-slate-900">Inherit Default Credential Profile</div>
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
                    <span className="text-slate-500">Remote Authentication User:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900">{endpoint.authUser || 'No credential configured'}</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">✓ Passwords Encrypted & Protected</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={handleSaveCredentialConfig}
                    disabled={isSavingCreds}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs disabled:opacity-50 cursor-pointer"
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
                  <h3 className="font-bold text-slate-900 text-xs">Local Accounts on {endpoint.hostname}</h3>
                  <p className="text-[11px] text-slate-500">Local user accounts queried directly from remote Windows target</p>
                </div>
                <button
                  onClick={() => setIsCreateUserOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" /> Create Local User
                </button>
              </div>

              {sectionStatuses['LocalAccounts']?.isAvailable === false && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Unable to query local accounts from remote host. Reason: {sectionStatuses['LocalAccounts'].errorMessage}</span>
                </div>
              )}

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
                    {localAccounts.length > 0 ? (
                      localAccounts.map((acc: LocalAccountDto, idx: number) => (
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
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 cursor-pointer"
                            >
                              <Lock className="h-3 w-3" /> Reset Password
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No local accounts retrieved yet. Click "Check Connection & Authenticate" above to perform a live remote WMI query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security Software Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 border border-slate-200 rounded">
                <h3 className="font-bold text-slate-900 text-xs">Security Software & Defender Status</h3>
                <p className="text-[11px] text-slate-500">Live security products queried directly from remote SecurityCenter2 WMI provider</p>
              </div>

              {sectionStatuses['SecuritySoftware']?.isAvailable === false && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Unable to query Security Center. Reason: {sectionStatuses['SecuritySoftware'].errorMessage}</span>
                </div>
              )}

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
                    {securitySoftware.length > 0 ? (
                      securitySoftware.map((sec: SecuritySoftwareDto, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[#2F3EA0]" />
                            <span>{sec.productName}</span>
                          </td>
                          <td className="p-2.5 text-slate-700">{sec.vendor || 'Microsoft Corporation'}</td>
                          <td className="p-2.5 font-mono text-slate-700">{sec.version || 'Live'}</td>
                          <td className="p-2.5 font-semibold text-emerald-700">{sec.status}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              Running & Enabled
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No security software items retrieved yet. Click "Check Connection & Authenticate" above to query remote security state.
                        </td>
                      </tr>
                    )}
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

              {!isOnline && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Endpoint is currently Offline. Restart, Shutdown, and Log Off are disabled until host returns online.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <button
                  onClick={() => setPowerActionModal({ isOpen: true, action: 'Restart' })}
                  disabled={!isOnline}
                  className="flex flex-col items-center justify-center p-4 border border-slate-300 rounded hover:border-[#2F3EA0] hover:bg-blue-50/40 transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RotateCcw className="h-6 w-6 text-[#2F3EA0] mb-2" />
                  <span className="font-bold text-slate-900 text-xs">Restart System</span>
                  <span className="text-[10px] text-slate-500 mt-1">Reboots Windows OS</span>
                </button>

                <button
                  onClick={() => setPowerActionModal({ isOpen: true, action: 'Shutdown' })}
                  disabled={!isOnline}
                  className="flex flex-col items-center justify-center p-4 border border-rose-200 rounded hover:border-rose-400 hover:bg-rose-50/40 transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Power className="h-6 w-6 text-rose-600 mb-2" />
                  <span className="font-bold text-rose-900 text-xs">Shutdown System</span>
                  <span className="text-[10px] text-slate-500 mt-1">Powers off host</span>
                </button>

                <button
                  onClick={() => setPowerActionModal({ isOpen: true, action: 'LogOff' })}
                  disabled={!isOnline}
                  className="flex flex-col items-center justify-center p-4 border border-slate-300 rounded hover:border-slate-500 hover:bg-slate-100/60 transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <UserCheck className="h-6 w-6 text-slate-700 mb-2" />
                  <span className="font-bold text-slate-900 text-xs">Log Off Users</span>
                  <span className="text-[10px] text-slate-500 mt-1">Ends user sessions</span>
                </button>

                <button
                  onClick={() => setPowerActionModal({ isOpen: true, action: 'PowerOn' })}
                  disabled={!hasMacAddress}
                  className="flex flex-col items-center justify-center p-4 border border-amber-300 rounded hover:border-amber-500 hover:bg-amber-50 transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Zap className="h-6 w-6 text-amber-600 mb-2" />
                  <span className="font-bold text-amber-900 text-xs">Power On (WOL)</span>
                  <span className="text-[10px] text-slate-500 mt-1">Sends Magic Packet</span>
                </button>
              </div>
            </div>
          )}

          {/* Network Interfaces Tab */}
          {activeTab === 'network' && (
            <div className="space-y-4">
              {sectionStatuses['NetworkInterfaces']?.isAvailable === false && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Unable to query network interfaces. Reason: {sectionStatuses['NetworkInterfaces'].errorMessage}</span>
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2">Adapter Name</th>
                      <th className="p-2">IPv4 Address</th>
                      <th className="p-2">IPv6 Address</th>
                      <th className="p-2">MAC Address</th>
                      <th className="p-2">Link Speed</th>
                      <th className="p-2">Gateway / DNS</th>
                      <th className="p-2">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {nics.length > 0 ? (
                      nics.map((nic, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-semibold text-slate-900">{nic.adapterName || 'Ethernet Adapter'}</td>
                          <td className="p-2 font-mono text-slate-800">{nic.ipv4Address || '—'}</td>
                          <td className="p-2 font-mono text-slate-500">{nic.ipv6Address || '—'}</td>
                          <td className="p-2 font-mono text-slate-600">{nic.macAddress || '—'}</td>
                          <td className="p-2 font-mono text-slate-700">{nic.linkSpeedMbps ? `${nic.linkSpeedMbps} Mbps` : '1000 Mbps'}</td>
                          <td className="p-2 text-slate-600">{nic.gateway || nic.dnsServers || '—'}</td>
                          <td className="p-2">
                            <StatusBadge status={nic.connectionState || 'Connected'} size="sm" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">No network interfaces recorded yet. Click "Check Connection & Authenticate" above to query remote interfaces.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Software Tab */}
          {activeTab === 'software' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 border border-slate-200 rounded">
                <div className="relative w-64">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={softwareSearch}
                    onChange={(e) => setSoftwareSearch(e.target.value)}
                    placeholder="Filter installed software..."
                    className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0] bg-white"
                  />
                </div>
                <button
                  onClick={() => setInstallModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs cursor-pointer"
                >
                  <Package className="h-4 w-4" /> Install Package (.msi / .exe)
                </button>
              </div>

              {sectionStatuses['InstalledSoftware']?.isAvailable === false && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Unable to query installed software inventory. Reason: {sectionStatuses['InstalledSoftware'].errorMessage}</span>
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded max-h-72 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2.5">Application Name</th>
                      <th className="p-2.5">Publisher / Vendor</th>
                      <th className="p-2.5">Version</th>
                      <th className="p-2.5">Arch</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {softwareList.length > 0 ? (
                      softwareList.map((sw) => (
                        <tr key={sw.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{sw.softwareName}</td>
                          <td className="p-2.5 text-slate-600">{sw.publisher || 'Microsoft / Enterprise'}</td>
                          <td className="p-2.5 font-mono text-slate-700">{sw.version || '—'}</td>
                          <td className="p-2.5 font-mono text-slate-500">{sw.architecture || 'x64'}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleUninstallSoftware(sw.softwareName)}
                              disabled={isUninstallingSw === sw.softwareName}
                              className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {isUninstallingSw === sw.softwareName ? 'Uninstalling...' : 'Uninstall'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">No software items match query or recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drives & Storage Tab */}
          {activeTab === 'drives' && (
            <div className="space-y-4">
              {sectionStatuses['Storage']?.isAvailable === false && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Unable to query physical disks & partitions. Reason: {sectionStatuses['Storage'].errorMessage}</span>
                </div>
              )}

              {physicalDisks.length > 0 ? (
                <div className="space-y-4">
                  {physicalDisks.map((disk) => (
                    <div key={disk.diskIndex} className="p-4 border border-slate-200 rounded bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between font-bold text-slate-900 text-xs border-b border-slate-200 pb-2">
                        <span className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-[#2F3EA0]" />
                          <span>Physical Disk {disk.diskIndex}: {disk.model} ({disk.capacityGb} GB - {disk.mediaType})</span>
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">S/N: {disk.serialNumber || 'N/A'}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                        {disk.partitions.map((d, pIdx) => {
                          const total = d.capacityGb || 100;
                          const free = d.freeSpaceGb || 0;
                          const used = d.usedSpaceGb || (total - free);
                          const percent = Math.round((used / Math.max(total, 1)) * 100);

                          return (
                            <div key={pIdx} className="p-3 border border-slate-200 rounded bg-white space-y-2">
                              <div className="flex items-center justify-between font-semibold text-slate-900 text-xs">
                                <span>Volume {d.driveLetter || 'Partition'} ({d.fileSystem || 'NTFS'})</span>
                                <span>{percent}% Used</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div className={`h-full ${percent > 85 ? 'bg-rose-500' : 'bg-[#2F3EA0]'}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                                <span>Free: {free} GB</span>
                                <span>Used: {used} GB / {total} GB</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : drives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {drives.map((d, idx) => {
                    const total = d.capacityGb || 100;
                    const free = d.freeSpaceGb || 0;
                    const used = d.usedSpaceGb || (total - free);
                    const percent = Math.round((used / Math.max(total, 1)) * 100);

                    return (
                      <div key={idx} className="p-3 border border-slate-200 rounded bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between font-semibold text-slate-900 text-xs">
                          <span>Drive {d.driveLetter || 'Local Disk'} ({d.fileSystem || 'NTFS'})</span>
                          <span>{percent}% Used</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className={`h-full ${percent > 85 ? 'bg-rose-500' : 'bg-[#2F3EA0]'}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>Free: {free} GB</span>
                          <span>Total: {total} GB</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 border border-slate-200 rounded">
                  No disk or partition configuration recorded yet. Click "Check Connection & Authenticate" above to query remote storage layout.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Power Action Confirm Modal */}
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
              className="text-[#2F3EA0] focus:ring-[#2F3EA0] rounded"
            />
            <label htmlFor="isAdminCheck" className="text-xs text-slate-700 font-medium">Add account to Administrators group</label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateUserOpen(false)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingUser}
              className="px-3 py-1.5 text-xs bg-[#2F3EA0] hover:bg-[#233080] text-white font-semibold rounded disabled:opacity-50"
            >
              {isCreatingUser ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal to Reset User Password */}
      <Modal isOpen={resetUserModal.isOpen} onClose={() => setResetUserModal({ isOpen: false, username: null })} title={`Reset Password for ${resetUserModal.username}`}>
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Target Username</label>
            <input
              type="text"
              readOnly
              value={resetUserModal.username || ''}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-slate-100 rounded font-mono text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">New Password *</label>
            <input
              type="password"
              required
              value={resetPasswordInput}
              onChange={(e) => setResetPasswordInput(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setResetUserModal({ isOpen: false, username: null })}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isResettingPassword || !resetPasswordInput}
              className="px-3 py-1.5 text-xs bg-[#2F3EA0] hover:bg-[#233080] text-white font-semibold rounded disabled:opacity-50"
            >
              {isResettingPassword ? 'Resetting...' : 'Confirm Reset Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Install Software Package (.msi / .exe) */}
      <Modal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        title={`Install Package (.msi / .exe) on ${endpoint.hostname}`}
      >
        <form onSubmit={handleInstallSoftwareSubmit} className="space-y-3 font-sans text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Package / File Name (.msi or .exe) *</label>
            <input
              type="text"
              required
              value={installPackageInput}
              onChange={(e) => setInstallPackageInput(e.target.value)}
              placeholder="e.g. 7zip-x64.msi or ChromeEnterprise.exe"
              className="w-full p-2 border rounded font-mono text-xs"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Automatic silent flags will be appended (<code className="font-mono text-indigo-700">/qn /norestart</code> for .msi, <code className="font-mono text-indigo-700">/quiet /norestart</code> for .exe).
            </span>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Package Version (Optional)</label>
            <input
              type="text"
              value={installVersionInput}
              onChange={(e) => setInstallVersionInput(e.target.value)}
              placeholder="e.g. 23.01"
              className="w-full p-2 border rounded font-mono text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setInstallModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInstallingSw}
              className="px-3.5 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold cursor-pointer disabled:opacity-50"
            >
              {isInstallingSw ? 'Initiating Remote Install...' : 'Install Package'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Endpoint Confirmation */}
      <Modal
        isOpen={isDeleteDetailPageModalOpen}
        onClose={() => setIsDeleteDetailPageModalOpen(false)}
        title="Confirm Endpoint Deletion"
        subtitle={`Permanently remove '${endpoint?.hostname}' from inventory`}
        maxWidth="md"
      >
        <div className="space-y-4 font-sans">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded text-rose-900">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs">Warning: Unrecoverable Inventory Removal</p>
              <p className="text-xs text-rose-800">
                Are you sure you want to delete endpoint <span className="font-bold">{endpoint?.hostname}</span>? This will remove all associated hardware inventory details, credential mappings, and audit history references.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDeleteDetailPageModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteEndpointMutation.isPending}
              onClick={() => {
                if (endpoint?.id) {
                  deleteEndpointMutation.mutate(endpoint.id, {
                    onSuccess: () => {
                      setIsDeleteDetailPageModalOpen(false);
                      navigate('/endpoints');
                    },
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteEndpointMutation.isPending ? 'Deleting...' : `Confirm Delete '${endpoint?.hostname}'`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
