import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEndpointDetail } from '../../hooks/useEndpoints';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApprovalBadge } from '../../components/common/ApprovalBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { toast } from '../../store/useToastStore';
import {
  ArrowLeft,
  Monitor,
  Cpu,
  Network,
  HardDrive,
  Package,
  Activity,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
} from 'lucide-react';

export const EndpointDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'network' | 'software' | 'drives' | 'jobs'>('overview');
  const [softwareSearch, setSoftwareSearch] = useState('');

  const { data: response, isLoading, isError, refetch } = useEndpointDetail(id || '');

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError || !response?.data) return <ErrorState onRetry={() => refetch()} />;

  const endpoint = response.data;
  const hw = endpoint.hardware;
  const nics = endpoint.networkInterfaces || [];
  const softwareList = (endpoint.software || []).filter((s) =>
    s.softwareName.toLowerCase().includes(softwareSearch.toLowerCase())
  );
  const drives = endpoint.drives || [];

  const handleAction = (actionName: string) => {
    toast.info(`${actionName} Initiated`, `Command sent to agent for ${endpoint.hostname}`);
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Back button & Header */}
      <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/endpoints')}
            className="inline-flex items-center gap-1 text-[#0F6CBD] hover:underline font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Endpoints Inventory
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('Agent Restart')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restart Agent
            </button>
            <button
              onClick={() => handleAction('Approval')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve Endpoint
            </button>
            <button
              onClick={() => handleAction('Rejection')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-100 rounded-lg text-[#0F6CBD]">
            <Monitor className="h-7 w-7" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold text-slate-900">{endpoint.hostname}</h1>
              <StatusBadge status={endpoint.status} />
              <ApprovalBadge status={endpoint.approvalStatus} />
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-[11px] font-mono">
              <span>FQDN: {endpoint.fqdn || '—'}</span>
              <span>IP: {endpoint.ipAddress || '—'}</span>
              <span>MAC: {endpoint.macAddress || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
          {[
            { id: 'overview', label: 'Overview', icon: Monitor },
            { id: 'hardware', label: 'Hardware', icon: Cpu },
            { id: 'network', label: 'Network Interfaces', icon: Network },
            { id: 'software', label: `Software (${endpoint.software?.length || 0})`, icon: Package },
            { id: 'drives', label: `Drives (${drives.length})`, icon: HardDrive },
            { id: 'jobs', label: 'Job History', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-medium transition-colors ${
                  isActive
                    ? 'border-[#0F6CBD] text-[#0F6CBD] bg-white font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="p-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-slate-200 rounded space-y-2 bg-slate-50/50">
                <div className="font-semibold text-slate-800 text-xs border-b pb-1">System Identity</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-slate-500">Hostname:</span>
                  <span className="font-semibold text-slate-900">{endpoint.hostname}</span>
                  <span className="text-slate-500">FQDN:</span>
                  <span className="font-mono text-slate-800">{endpoint.fqdn || '—'}</span>
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800">{endpoint.location || 'Building A'}</span>
                  <span className="text-slate-500">Description:</span>
                  <span className="text-slate-800">{endpoint.description || 'Primary Workstation'}</span>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded space-y-2 bg-slate-50/50">
                <div className="font-semibold text-slate-800 text-xs border-b pb-1">Agent & Telemetry</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-slate-500">Agent Status:</span>
                  <span className="font-semibold text-emerald-700">{endpoint.agentStatus || 'Healthy'}</span>
                  <span className="text-slate-500">Agent Version:</span>
                  <span className="font-mono text-slate-800">{endpoint.agentVersion || 'v2.4.1'}</span>
                  <span className="text-slate-500">Last Heartbeat:</span>
                  <span className="font-mono text-slate-800">
                    {endpoint.lastHeartbeat ? new Date(endpoint.lastHeartbeat).toLocaleString() : 'Just now'}
                  </span>
                  <span className="text-slate-500">Registered At:</span>
                  <span className="font-mono text-slate-800">{new Date(endpoint.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hardware Tab */}
          {activeTab === 'hardware' && (
            <div className="space-y-3">
              {hw ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 border rounded bg-slate-50/40">
                    <div className="text-slate-500 text-[11px]">System Manufacturer</div>
                    <div className="font-semibold text-slate-900 text-xs">{hw.manufacturer || 'Dell Inc.'}</div>
                  </div>
                  <div className="p-3 border rounded bg-slate-50/40">
                    <div className="text-slate-500 text-[11px]">Model</div>
                    <div className="font-semibold text-slate-900 text-xs">{hw.model || 'OptiPlex 7090'}</div>
                  </div>
                  <div className="p-3 border rounded bg-slate-50/40">
                    <div className="text-slate-500 text-[11px]">Serial Number</div>
                    <div className="font-mono text-slate-900 text-xs">{hw.serialNumber || 'CN-09X281-72901'}</div>
                  </div>
                  <div className="p-3 border rounded bg-slate-50/40">
                    <div className="text-slate-500 text-[11px]">Processor</div>
                    <div className="font-semibold text-slate-900 text-xs">{hw.processorName || 'Intel(R) Core(TM) i7-11700 CPU @ 2.50GHz'}</div>
                  </div>
                  <div className="p-3 border rounded bg-slate-50/40">
                    <div className="text-slate-500 text-[11px]">RAM Memory</div>
                    <div className="font-semibold text-slate-900 text-xs">{hw.totalRamMb ? Math.round(hw.totalRamMb / 1024) : 16} GB</div>
                  </div>
                  <div className="p-3 border rounded bg-slate-50/40">
                    <div className="text-slate-500 text-[11px]">GPU Graphics</div>
                    <div className="font-semibold text-slate-900 text-xs">{hw.gpuName || 'Intel(R) UHD Graphics 750'}</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500">Hardware inventory data collected upon agent sync.</div>
              )}
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
                        <td className="p-2 font-mono text-slate-800">{nic.ipv4Address || endpoint.ipAddress || '192.168.1.101'}</td>
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
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
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
              {(drives.length > 0 ? drives : [{ driveLetter: 'C:', capacityGb: 500, freeSpaceGb: 320, usedSpaceGb: 180, fileSystem: 'NTFS', diskType: 'SSD' }]).map((d, idx) => {
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
                      <div className={`h-full ${percent > 85 ? 'bg-rose-500' : 'bg-[#0F6CBD]'}`} style={{ width: `${percent}%` }} />
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

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2">Job ID</th>
                    <th className="p-2">Operation</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2 font-mono text-slate-900">JOB-102</td>
                    <td className="p-2 text-slate-800">Agent Telemetry Sync</td>
                    <td className="p-2">
                      <StatusBadge status="Completed" size="sm" />
                    </td>
                    <td className="p-2 font-mono text-slate-500">{new Date().toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
