import React, { useState } from 'react';
import {
  useDiscoveredEndpoints,
  useStartDiscoveryScan,
  useImportDiscoveredEndpoints,
} from '../../hooks/useDiscovery';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Play, Plus, RefreshCw, Network, CheckSquare, Square } from 'lucide-react';

export const DiscoveryPage: React.FC = () => {
  const [cidrInput, setCidrInput] = useState('192.168.1.0/24');
  const [selectedDiscoveredIds, setSelectedDiscoveredIds] = useState<string[]>([]);

  const { data: discovered = [], isLoading: isDiscLoading, refetch } = useDiscoveredEndpoints();
  const startScanMutation = useStartDiscoveryScan();
  const importDiscoveredMutation = useImportDiscoveredEndpoints();

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (cidrInput.trim()) {
      startScanMutation.mutate(cidrInput.trim());
    }
  };

  const isAllSelected = discovered.length > 0 && selectedDiscoveredIds.length === discovered.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDiscoveredIds([]);
    } else {
      setSelectedDiscoveredIds(discovered.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDiscoveredIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleImportSelected = () => {
    if (selectedDiscoveredIds.length === 0) return;
    importDiscoveredMutation.mutate(selectedDiscoveredIds, {
      onSuccess: () => setSelectedDiscoveredIds([]),
    });
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

      {isDiscLoading && <LoadingSkeleton rows={5} />}

      {/* Discovered Endpoints Table */}
      {!isDiscLoading && (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span>Discovered Endpoint Candidates ({discovered.length})</span>
            {selectedDiscoveredIds.length > 0 && (
              <button
                onClick={handleImportSelected}
                disabled={importDiscoveredMutation.isPending}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> Import {selectedDiscoveredIds.length} Selected into Managed Inventory
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-2.5 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-900">
                      {isAllSelected ? <CheckSquare className="h-4 w-4 text-[#0F6CBD]" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="p-2.5">Hostname</th>
                  <th className="p-2.5">IP Address</th>
                  <th className="p-2.5">MAC Address</th>
                  <th className="p-2.5">OS Name</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {discovered.map((item) => {
                  const isSelected = selectedDiscoveredIds.includes(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center" onClick={() => toggleSelect(item.id)}>
                        <button className="text-slate-500 hover:text-slate-900">
                          {isSelected ? <CheckSquare className="h-4 w-4 text-[#0F6CBD]" /> : <Square className="h-4 w-4 text-slate-300" />}
                        </button>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900">{item.hostname}</td>
                      <td className="p-2.5 font-mono text-slate-700">{item.ipAddress}</td>
                      <td className="p-2.5 font-mono text-slate-500">{item.macAddress || '—'}</td>
                      <td className="p-2.5 text-slate-800">{item.osName || 'Windows 11 Enterprise'}</td>
                      <td className="p-2.5 font-mono text-slate-600">{item.discoveryMethod}</td>
                      <td className="p-2.5">
                        <StatusBadge status={item.status === 'Managed' ? 'Online' : 'Pending'} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
