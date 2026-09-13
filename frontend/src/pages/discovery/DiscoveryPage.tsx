import React, { useState } from 'react';
import {
  useDiscoveryScans,
  useDiscoveredEndpoints,
  useStartDiscoveryScan,
  useAddToManaged,
} from '../../hooks/useDiscovery';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Play, Plus, RefreshCw, Network } from 'lucide-react';

export const DiscoveryPage: React.FC = () => {
  const [cidrInput, setCidrInput] = useState('192.168.1.0/24');
  const { isLoading: isScansLoading, refetch } = useDiscoveryScans();
  const { data: discovered = [], isLoading: isDiscLoading } = useDiscoveredEndpoints();

  const startScanMutation = useStartDiscoveryScan();
  const addToManagedMutation = useAddToManaged();

  const isLoading = isScansLoading || isDiscLoading;

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (cidrInput.trim()) {
      startScanMutation.mutate(cidrInput.trim());
    }
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">Network & Endpoint Discovery Scan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Scan air-gapped subnet CIDR ranges to discover unmanaged Windows endpoints</p>
        </div>
        <button
          onClick={() => refetch()}
          aria-label="Refresh discovery scans"
          className="p-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* CIDR Scan Configuration Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-3">
        <h2 className="font-semibold text-slate-800 text-xs">Initiate Subnet Discovery Scan</h2>
        <form onSubmit={handleStartScan} className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Target Subnet CIDR</label>
            <div className="relative">
              <Network className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={cidrInput}
                onChange={(e) => setCidrInput(e.target.value)}
                placeholder="e.g. 192.168.1.0/24"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded font-mono focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Credential Profile</label>
            <select className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
              <option>Domain Admin Profile (corp.local)</option>
              <option>Local Admin Accounts</option>
              <option>WMI Anonymous Ping</option>
            </select>
          </div>

          <div className="pt-5">
            <button
              type="submit"
              disabled={startScanMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {startScanMutation.isPending ? 'Starting Scan...' : 'Start Discovery Scan'}
            </button>
          </div>
        </form>
      </div>

      {isLoading && <LoadingSkeleton rows={5} />}

      {/* Discovered Endpoints Table */}
      {!isLoading && (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between">
            <span>Discovered Endpoint Candidates ({discovered.length})</span>
            <span className="text-slate-500 font-normal text-[11px]">Unmanaged machines detected during active scans</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-2.5">Hostname</th>
                  <th className="p-2.5">IP Address</th>
                  <th className="p-2.5">MAC Address</th>
                  <th className="p-2.5">OS Name</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {discovered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold text-slate-900">{item.hostname}</td>
                    <td className="p-2.5 font-mono text-slate-700">{item.ipAddress}</td>
                    <td className="p-2.5 font-mono text-slate-500">{item.macAddress || '—'}</td>
                    <td className="p-2.5 text-slate-800">{item.osName || 'Windows 11 Enterprise'}</td>
                    <td className="p-2.5 font-mono text-slate-600">{item.discoveryMethod}</td>
                    <td className="p-2.5">
                      <StatusBadge status={item.status === 'Managed' ? 'Online' : 'Pending'} size="sm" />
                    </td>
                    <td className="p-2.5 text-right">
                      {item.status === 'Unmanaged' ? (
                        <button
                          onClick={() => addToManagedMutation.mutate(item.id)}
                          disabled={addToManagedMutation.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" /> Add to Managed
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px]">Managed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
