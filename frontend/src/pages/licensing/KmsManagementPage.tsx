import React, { useState, useEffect } from 'react';
import { licensingApi, type LicensingOverview, type KmsHostItem, type ActivationWaveItem, type OfflinePackageItem } from '../../api/licensingApi';
import { toast } from '../../store/useToastStore';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  RefreshCw,
  Plus,
  Play,
  Pause,
  Download,
  Upload,
  ShieldCheck,
  Building2,
  HardDriveUpload,
  Monitor,
} from 'lucide-react';

export const KmsManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hosts' | 'waves' | 'packages'>('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<LicensingOverview | null>(null);
  const [hosts, setHosts] = useState<KmsHostItem[]>([]);
  const [waves, setWaves] = useState<ActivationWaveItem[]>([]);
  const [packages, setPackages] = useState<OfflinePackageItem[]>([]);

  // Modals
  const [isAddHostOpen, setIsAddHostOpen] = useState(false);
  const [newHostName, setNewHostName] = useState('');
  const [newHostFqdn, setNewHostFqdn] = useState('');
  const [newHostIp, setNewHostIp] = useState('');
  const [newHostPort, setNewHostPort] = useState(1688);
  const [newHostSite, setNewHostSite] = useState('');
  const [isSavingHost, setIsSavingHost] = useState(false);

  const [isCreateWaveOpen, setIsCreateWaveOpen] = useState(false);
  const [waveNameInput, setWaveNameInput] = useState('');
  const [waveSizeInput, setWaveSizeInput] = useState(25);
  const [isCreatingWave, setIsCreatingWave] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [packageJsonInput, setPackageJsonInput] = useState('');
  const [isImportingPkg, setIsImportingPkg] = useState(false);

  const [checkingHostId, setCheckingHostId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovData, hostsData, wavesData, pkgsData] = await Promise.all([
        licensingApi.getOverview(),
        licensingApi.getKmsHosts(),
        licensingApi.getWaves(),
        licensingApi.getOfflineHistory(),
      ]);
      setOverview(ovData);
      setHosts(hostsData || []);
      setWaves(wavesData || []);
      setPackages(pkgsData || []);
    } catch (err: any) {
      toast.error('Failed to load KMS Licensing data', err?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostName.trim() || !newHostFqdn.trim()) return;
    setIsSavingHost(true);
    try {
      await licensingApi.createKmsHost({
        name: newHostName.trim(),
        hostname: newHostFqdn.trim(),
        fqdn: newHostFqdn.trim(),
        ipAddress: newHostIp.trim() || undefined,
        port: newHostPort,
        site: newHostSite.trim() || undefined,
      });
      toast.success('KMS Host Registered', `KMS Host '${newHostName}' added successfully.`);
      setIsAddHostOpen(false);
      setNewHostName('');
      setNewHostFqdn('');
      setNewHostIp('');
      loadData();
    } catch (err: any) {
      toast.error('Registration Failed', err?.response?.data?.message || 'Failed to create KMS host');
    } finally {
      setIsSavingHost(false);
    }
  };

  const handleCheckHostHealth = async (id: string, name: string) => {
    setCheckingHostId(id);
    try {
      const res: any = await licensingApi.checkHostHealth(id);
      if (res.status === 'Online') {
        toast.success('KMS Host Online', `${name} responded on TCP 1688 in ${res.latencyMs} ms`);
      } else {
        toast.error('KMS Host Warning/Offline', `${name} check failed: ${res.errorMessage || 'Port unreachable'}`);
      }
      loadData();
    } catch (err: any) {
      toast.error('Health Check Failed', err?.message || 'Unable to probe KMS host');
    } finally {
      setCheckingHostId(null);
    }
  };

  const handleCreateWaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waveNameInput.trim()) return;
    setIsCreatingWave(true);
    try {
      await licensingApi.createWave(waveNameInput.trim(), waveSizeInput);
      toast.success('Activation Wave Created', `Wave '${waveNameInput}' created with chunk size ${waveSizeInput}`);
      setIsCreateWaveOpen(false);
      setWaveNameInput('');
      loadData();
    } catch (err: any) {
      toast.error('Wave Creation Failed', err?.response?.data?.message || 'Failed to create wave');
    } finally {
      setIsCreatingWave(false);
    }
  };

  const handleStartWave = async (id: string, name: string) => {
    try {
      await licensingApi.startWave(id);
      toast.success('Activation Wave Started', `Wave '${name}' is now running.`);
      loadData();
    } catch (err: any) {
      toast.error('Start Failed', err?.message || 'Failed to start wave');
    }
  };

  const handlePauseWave = async (id: string, name: string) => {
    try {
      await licensingApi.pauseWave(id);
      toast.info('Activation Wave Paused', `Wave '${name}' has been paused.`);
      loadData();
    } catch (err: any) {
      toast.error('Pause Failed', err?.message || 'Failed to pause wave');
    }
  };

  const handleExportPackage = async () => {
    try {
      toast.info('Generating Air-Gapped Transfer Package...', 'Creating cryptographically signed JSON manifest');
      const blob = await licensingApi.exportPackage('AIRGAP-PRODUCTION', 'Volume Activation Sync Package');
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RemoteAdmin-KMS-Package-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Package Exported', 'Downloaded signed package file.');
      loadData();
    } catch (err: any) {
      toast.error('Export Failed', err?.message || 'Failed to export package');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageJsonInput.trim()) return;
    setIsImportingPkg(true);
    try {
      const val: any = await licensingApi.validatePackage(packageJsonInput.trim());
      if (!val.isValid) {
        toast.error('Cryptographic Validation Failed', val.validationErrors?.[0] || 'Signature/Hash invalid');
        setIsImportingPkg(false);
        return;
      }

      await licensingApi.importPackage(packageJsonInput.trim());
      toast.success('Package Verified & Imported', `Imported ${val.totalRecords} records from ${val.packageId}`);
      setIsImportModalOpen(false);
      setPackageJsonInput('');
      loadData();
    } catch (err: any) {
      toast.error('Import Failed', err?.response?.data?.message || 'Import error');
    } finally {
      setIsImportingPkg(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#2F3EA0]" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">KMS & Volume Activation Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized orchestration for Microsoft Volume Licensing (Windows 10/11, Server 2022/2025, Office LTSC 2024) across 500+ air-gapped endpoints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#2F3EA0] ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsAddHostOpen(true)}
            className="px-3.5 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold hover:bg-[#253285] shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add KMS Host
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold space-x-1">
        {[
          { id: 'overview', label: 'Overview Dashboard', icon: Activity },
          { id: 'hosts', label: `KMS Hosts (${hosts.length})`, icon: Server },
          { id: 'waves', label: `Activation Waves (${waves.length})`, icon: Layers },
          { id: 'packages', label: `Air-Gapped Packages (${packages.length})`, icon: HardDriveUpload },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#2F3EA0] text-[#2F3EA0] bg-white font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && <LoadingSkeleton rows={6} />}

      {!loading && (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>KMS Host Health</span>
                    <Server className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {overview.kmsHostsHealthy} / {overview.kmsHostsTotal}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>TCP 1688 Reachable</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Windows Activated</span>
                    <Monitor className="h-4 w-4 text-[#2F3EA0]" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{overview.windowsActivated}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <span>{overview.windowsNotActivated} Not Activated | {overview.windowsFailed} Failed</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Office LTSC 2024 Activated</span>
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{overview.officeActivated}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <span>{overview.officeNotActivated} Not Activated</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>License Compliance</span>
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{overview.compliancePercentage}%</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-[#2F3EA0] h-full" style={{ width: `${overview.compliancePercentage}%` }} />
                  </div>
                </div>
              </div>

              {/* Top KMS Hosts & Recent Failures */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border rounded-lg bg-white p-4 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Server className="h-4 w-4 text-[#2F3EA0]" /> Active KMS Hosts
                  </h3>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b">
                      <tr>
                        <th className="p-2">Host</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Latency</th>
                        <th className="p-2">Port</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-800 font-medium">
                      {hosts.map((h) => (
                        <tr key={h.id}>
                          <td className="p-2 font-bold">{h.name} ({h.hostname})</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.status === 'Online' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {h.status}
                            </span>
                          </td>
                          <td className="p-2 font-mono">{h.responseLatencyMs} ms</td>
                          <td className="p-2 font-mono">{h.port}</td>
                        </tr>
                      ))}
                      {hosts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">No KMS Hosts registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border rounded-lg bg-white p-4 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 text-rose-700">
                    <AlertTriangle className="h-4 w-4 text-rose-600" /> Attention Required / Failures
                  </h3>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b">
                      <tr>
                        <th className="p-2">Endpoint</th>
                        <th className="p-2">Product</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-800 font-medium">
                      {overview.recentActivationFailures.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 font-bold">{r.endpointHostname || r.endpointId}</td>
                          <td className="p-2">{r.productName}</td>
                          <td className="p-2 text-rose-700 font-semibold">{r.activationStatus}</td>
                        </tr>
                      ))}
                      {overview.recentActivationFailures.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-emerald-600 font-semibold">No active activation failures detected.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* KMS HOSTS TAB */}
          {activeTab === 'hosts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 border rounded">
                <span className="font-bold text-slate-900 text-xs">Registered Volume Activation KMS Hosts</span>
                <button
                  onClick={() => setIsAddHostOpen(true)}
                  className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add KMS Server
                </button>
              </div>

              <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">FQDN / Hostname</th>
                      <th className="p-3">Port</th>
                      <th className="p-3">Site / Environment</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Latency</th>
                      <th className="p-3">Last Check</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800">
                    {hosts.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{h.name}</td>
                        <td className="p-3 font-mono text-slate-700">{h.hostname}</td>
                        <td className="p-3 font-mono">{h.port}</td>
                        <td className="p-3">{h.site || 'Main'} / {h.environment || 'Production'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.status === 'Online' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{h.responseLatencyMs} ms</td>
                        <td className="p-3 text-slate-500">
                          {h.lastHealthCheck ? new Date(h.lastHealthCheck).toLocaleTimeString() : 'Never'}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleCheckHostHealth(h.id, h.name)}
                            disabled={checkingHostId === h.id}
                            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                          >
                            {checkingHostId === h.id ? 'Probing...' : 'Probe TCP 1688'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {hosts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500">No KMS Hosts registered. Click 'Add KMS Host' to register.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACTIVATION WAVES TAB */}
          {activeTab === 'waves' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 border rounded">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Controlled Activation Waves</span>
                  <span className="text-[11px] text-slate-500">Rate-limited rollout across 500+ endpoints with max concurrency = 10.</span>
                </div>
                <button
                  onClick={() => setIsCreateWaveOpen(true)}
                  className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Wave
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {waves.map((w) => (
                  <div key={w.id} className="p-4 border rounded-lg bg-white shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{w.name}</h4>
                        <p className="text-xs text-slate-500">
                          Chunk Size: {w.waveSize} | Created by {w.createdBy || 'Admin'} at {new Date(w.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-800">{w.status}</span>
                        {w.status !== 'Running' && (
                          <button
                            onClick={() => handleStartWave(w.id, w.name)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-emerald-700"
                          >
                            <Play className="h-3 w-3" /> Start Wave
                          </button>
                        )}
                        {w.status === 'Running' && (
                          <button
                            onClick={() => handlePauseWave(w.id, w.name)}
                            className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-amber-700"
                          >
                            <Pause className="h-3 w-3" /> Pause Wave
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2F3EA0] h-full transition-all"
                        style={{ width: `${w.totalEndpoints > 0 ? (w.activatedCount / w.totalEndpoints) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex gap-4 text-xs font-semibold text-slate-700">
                      <span>Total: {w.totalEndpoints}</span>
                      <span className="text-emerald-700">Activated: {w.activatedCount}</span>
                      <span className="text-rose-700">Failed: {w.failedCount}</span>
                    </div>
                  </div>
                ))}

                {waves.length === 0 && (
                  <div className="p-8 text-center border rounded bg-white text-slate-500 text-xs">
                    No activation waves created yet. Click 'Create Wave' to start a progressive activation rollout.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AIR-GAPPED PACKAGES TAB */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 border rounded">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Cryptographic Air-Gapped Transfer Packages</span>
                  <span className="text-[11px] text-slate-500">
                    Export signed JSON configuration packages from Staging to isolated Production environments.
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportPackage()}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100"
                  >
                    <Download className="h-3.5 w-3.5 text-[#2F3EA0]" /> Export Signed Package
                  </button>
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#253285]"
                  >
                    <Upload className="h-3.5 w-3.5" /> Import & Verify Package
                  </button>
                </div>
              </div>

              <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Package ID</th>
                      <th className="p-3">Source → Target</th>
                      <th className="p-3">SHA-256 Hash</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Records</th>
                      <th className="p-3">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800">
                    {packages.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-bold font-mono text-[#2F3EA0]">{p.packageId}</td>
                        <td className="p-3">{p.sourceEnvironment} → {p.targetEnvironment}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-500">{p.packageHash.slice(0, 16)}...</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Imported' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 font-bold">{p.recordCount}</td>
                        <td className="p-3 text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {packages.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">No air-gapped transfer package history recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Add KMS Host */}
      <Modal isOpen={isAddHostOpen} onClose={() => setIsAddHostOpen(false)} title="Register Enterprise KMS Host">
        <form onSubmit={handleCreateHostSubmit} className="space-y-3 font-sans text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Friendly Name *</label>
            <input
              type="text"
              required
              value={newHostName}
              onChange={(e) => setNewHostName(e.target.value)}
              placeholder="e.g. KMS-PRIMARY-01"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hostname / FQDN *</label>
            <input
              type="text"
              required
              value={newHostFqdn}
              onChange={(e) => setNewHostFqdn(e.target.value)}
              placeholder="e.g. kms1.domain.local"
              className="w-full p-2 border rounded font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">IP Address (Optional)</label>
              <input
                type="text"
                value={newHostIp}
                onChange={(e) => setNewHostIp(e.target.value)}
                placeholder="10.0.1.50"
                className="w-full p-2 border rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">TCP Port</label>
              <input
                type="number"
                value={newHostPort}
                onChange={(e) => setNewHostPort(parseInt(e.target.value) || 1688)}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Site / Location</label>
            <input
              type="text"
              value={newHostSite}
              onChange={(e) => setNewHostSite(e.target.value)}
              placeholder="e.g. HQ-DataCenter"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsAddHostOpen(false)}
              className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingHost}
              className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold cursor-pointer disabled:opacity-50"
            >
              {isSavingHost ? 'Registering...' : 'Register KMS Host'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Wave */}
      <Modal isOpen={isCreateWaveOpen} onClose={() => setIsCreateWaveOpen(false)} title="Create Activation Wave">
        <form onSubmit={handleCreateWaveSubmit} className="space-y-3 font-sans text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Wave Name *</label>
            <input
              type="text"
              required
              value={waveNameInput}
              onChange={(e) => setWaveNameInput(e.target.value)}
              placeholder="e.g. Wave 1 - Windows 11 Enterprise Rollout"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Endpoints per Chunk (Wave Size)</label>
            <input
              type="number"
              value={waveSizeInput}
              onChange={(e) => setWaveSizeInput(parseInt(e.target.value) || 25)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsCreateWaveOpen(false)}
              className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingWave}
              className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold cursor-pointer disabled:opacity-50"
            >
              {isCreatingWave ? 'Creating...' : 'Create Wave'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Import Air-Gapped Package */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import & Verify Air-Gapped Package">
        <form onSubmit={handleImportSubmit} className="space-y-3 font-sans text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Paste Package JSON Content *</label>
            <textarea
              required
              rows={8}
              value={packageJsonInput}
              onChange={(e) => setPackageJsonInput(e.target.value)}
              placeholder="Paste JSON manifest here..."
              className="w-full p-2 border rounded font-mono text-[11px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImportingPkg}
              className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold cursor-pointer disabled:opacity-50"
            >
              {isImportingPkg ? 'Verifying...' : 'Verify & Import'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
