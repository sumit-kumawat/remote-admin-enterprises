import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useEndpointDetail } from '../../hooks/useEndpoints';
import { endpointsApi } from '../../api/endpointsApi';
import { StatusBadge } from '../common/StatusBadge';
import {
  Monitor,
  HardDrive,
  Users,
  Package,
  Power,
  KeyRound,
  Trash2,
  Download,
  RotateCcw,
  Lock,
  LogOut,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface EndpointControlModalProps {
  endpointId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EndpointControlModal: React.FC<EndpointControlModalProps> = ({
  endpointId,
  isOpen,
  onClose,
}) => {
  const { data: endpoint } = useEndpointDetail(endpointId || '');

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'software' | 'power'>('overview');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // User Reset Password State
  const [targetUsername, setTargetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Software Install State
  const [packageName, setPackageName] = useState('');
  const [packageVersion, setPackageVersion] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  // Power Action State
  const [isPowering, setIsPowering] = useState(false);

  if (!isOpen || !endpointId) return null;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername || !newPassword) return;

    setIsResettingPassword(true);
    setStatusMessage(null);
    try {
      const res = await endpointsApi.resetUserPassword(endpointId, targetUsername, newPassword);
      setStatusMessage({ text: res.message || 'Password reset successfully' });
      setTargetUsername('');
      setNewPassword('');
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.message || 'Failed to reset password', isError: true });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleInstallSoftware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName) return;

    setIsInstalling(true);
    setStatusMessage(null);
    try {
      const res = await endpointsApi.installSoftware(endpointId, packageName, packageVersion);
      setStatusMessage({ text: res.message || 'Software installation initiated' });
      setPackageName('');
      setPackageVersion('');
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.message || 'Failed to initiate installation', isError: true });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstallSoftware = async (softwareName: string) => {
    setStatusMessage(null);
    try {
      const res = await endpointsApi.uninstallSoftware(endpointId, softwareName);
      setStatusMessage({ text: res.message || 'Software uninstallation initiated' });
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.message || 'Failed to uninstall software', isError: true });
    }
  };

  const handlePowerAction = async (action: string) => {
    setIsPowering(true);
    setStatusMessage(null);
    try {
      const res = await endpointsApi.powerControl(endpointId, action);
      setStatusMessage({ text: res.message || `Power action '${action}' executed successfully` });
    } catch (err: any) {
      setStatusMessage({ text: err.response?.data?.message || `Failed to execute ${action}`, isError: true });
    } finally {
      setIsPowering(false);
    }
  };

  const ep = endpoint?.data;
  const localAccounts = ep?.localAccounts || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Endpoint Management Console — ${ep?.hostname || 'Endpoint'}`}
      subtitle={`Resolved IP: ${ep?.ipAddress || 'Unassigned'} • OS: ${ep?.deviceType || 'Windows'}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs font-sans">
        {statusMessage && (
          <div
            className={`p-3 rounded border flex items-center justify-between text-xs animate-in fade-in ${
              statusMessage.isError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {statusMessage.isError ? (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold">
              ×
            </button>
          </div>
        )}

        <div className="flex border-b border-slate-200 bg-slate-50 p-1 rounded-t">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-[#2F3EA0] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" /> System Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-[#2F3EA0] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Local Accounts & Security
          </button>
          <button
            onClick={() => setActiveTab('software')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
              activeTab === 'software'
                ? 'bg-white text-[#2F3EA0] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="h-3.5 w-3.5" /> Software Management
          </button>
          <button
            onClick={() => setActiveTab('power')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
              activeTab === 'power'
                ? 'bg-white text-[#2F3EA0] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Power className="h-3.5 w-3.5" /> Power Controls
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 border border-slate-200 rounded">
              <div>
                <span className="text-[10px] text-slate-500 block">Hostname</span>
                <span className="font-bold text-slate-900">{ep?.hostname}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">IPv4 Address</span>
                <span className="font-mono text-slate-800">{ep?.ipAddress || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">MAC Address</span>
                <span className="font-mono text-slate-600">{ep?.macAddress || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Status</span>
                <StatusBadge status={ep?.status || 'Online'} size="sm" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
              <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-[#2F3EA0]" /> Storage Volumes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <div className="flex justify-between text-slate-800 font-semibold mb-1">
                    <span>C: (System OS)</span>
                    <span>120 GB / 256 GB</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#2F3EA0] h-full" style={{ width: '47%' }} />
                  </div>
                </div>
                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <div className="flex justify-between text-slate-800 font-semibold mb-1">
                    <span>D: (Data Volume)</span>
                    <span>340 GB / 512 GB</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full" style={{ width: '66%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
              <h4 className="font-semibold text-slate-800">Existing Local Accounts on Endpoint</h4>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2">Account Name</th>
                    <th className="p-2">Type / Role</th>
                    <th className="p-2">Group Memberships</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localAccounts.map((acc) => (
                    <tr key={acc.username} className="hover:bg-slate-50">
                      <td className="p-2 font-semibold text-slate-900">{acc.username}</td>
                      <td className="p-2 text-slate-600">{acc.isAdmin ? 'Administrator' : 'Standard User'}</td>
                      <td className="p-2 font-mono text-[#2F3EA0] font-semibold">{acc.groups?.join(', ') || 'Users'}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            acc.isEnabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {acc.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => {
                            setTargetUsername(acc.username);
                          }}
                          className="px-2 py-0.5 text-[11px] font-medium border border-slate-300 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleResetPassword} className="bg-white border border-slate-200 rounded p-3 space-y-3">
              <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-[#2F3EA0]" /> Reset / Change Local User Password
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Account Name</label>
                  <input
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="e.g. Administrator or ra"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong new password"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isResettingPassword || !targetUsername || !newPassword}
                className="px-3 py-1.5 bg-[#2F3EA0] hover:bg-[#233080] text-white font-semibold rounded text-xs transition-colors disabled:opacity-50"
              >
                {isResettingPassword ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'software' && (
          <div className="space-y-4">
            <form onSubmit={handleInstallSoftware} className="bg-white border border-slate-200 rounded p-3 space-y-3">
              <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Download className="h-4 w-4 text-[#2F3EA0]" /> Install New Package on Endpoint
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Package Name / Identifier</label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="e.g. 7-Zip, Google Chrome, WinRAR"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Version (Optional)</label>
                  <input
                    type="text"
                    value={packageVersion}
                    onChange={(e) => setPackageVersion(e.target.value)}
                    placeholder="e.g. 23.01"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isInstalling || !packageName}
                className="px-3 py-1.5 bg-[#2F3EA0] hover:bg-[#233080] text-white font-semibold rounded text-xs transition-colors disabled:opacity-50"
              >
                {isInstalling ? 'Initiating Installation...' : 'Deploy & Install Package'}
              </button>
            </form>

            <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
              <h4 className="font-semibold text-slate-800">Installed Software Inventory</h4>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2">Software Name</th>
                    <th className="p-2">Publisher</th>
                    <th className="p-2">Version</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(ep?.software || []).map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-2 font-semibold text-slate-900">{s.softwareName}</td>
                      <td className="p-2 text-slate-600">{s.publisher || 'N/A'}</td>
                      <td className="p-2 font-mono text-slate-700">{s.version}</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleUninstallSoftware(s.softwareName)}
                          className="px-2 py-1 text-[11px] font-medium border border-rose-300 rounded text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Uninstall
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'power' && (
          <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 text-xs">Remote Endpoint Power Actions</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Execute authoritative power lifecycle actions directly against {ep?.hostname}.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handlePowerAction('Restart')}
                disabled={isPowering}
                className="p-3 border border-amber-300 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 flex flex-col items-center gap-1.5 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-5 w-5 text-amber-700" />
                <span>Restart Endpoint</span>
              </button>

              <button
                onClick={() => handlePowerAction('Shutdown')}
                disabled={isPowering}
                className="p-3 border border-rose-300 rounded bg-rose-50 hover:bg-rose-100 text-rose-900 flex flex-col items-center gap-1.5 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                <Power className="h-5 w-5 text-rose-700" />
                <span>Shutdown Endpoint</span>
              </button>

              <button
                onClick={() => handlePowerAction('Lock')}
                disabled={isPowering}
                className="p-3 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 text-slate-800 flex flex-col items-center gap-1.5 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                <Lock className="h-5 w-5 text-slate-700" />
                <span>Lock Console</span>
              </button>

              <button
                onClick={() => handlePowerAction('Logoff')}
                disabled={isPowering}
                className="p-3 border border-blue-300 rounded bg-blue-50 hover:bg-blue-100 text-blue-900 flex flex-col items-center gap-1.5 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                <LogOut className="h-5 w-5 text-blue-700" />
                <span>Logoff Sessions</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Close Control Panel
          </button>
        </div>
      </div>
    </Modal>
  );
};
