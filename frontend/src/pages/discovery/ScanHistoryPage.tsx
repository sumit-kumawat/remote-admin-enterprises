import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScans } from '../../hooks/useDiscovery';
import { useDiscoveryHub } from '../../hooks/useDiscoveryHub';
import { discoveryApi } from '../../api/discoveryApi';
import { DiscoverySubnav } from './DiscoverySubnav';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { History, Search, ExternalLink, Download, Network, Play } from 'lucide-react';

export const ScanHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: scans = [], isLoading } = useScans();
  const { connectionStatus } = useDiscoveryHub();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredScans = scans.filter((scan) => {
    if (statusFilter !== 'All' && scan.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCidr = scan.targetCidr.toLowerCase().includes(q);
      const matchType = scan.scanType.toLowerCase().includes(q);
      const matchUser = scan.createdBy.toLowerCase().includes(q);
      if (!matchCidr && !matchType && !matchUser) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 text-xs font-sans">
      <DiscoverySubnav connectionStatus={connectionStatus} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 border border-slate-200 rounded-md shadow-xs gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-[#2F3EA0]" />
            Discovery Scan Execution History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit and review past network subnet scans, execution telemetry, and host discovery counts.
          </p>
        </div>

        <button
          onClick={() => navigate('/discovery')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs"
        >
          <Play className="h-3.5 w-3.5" /> New Scan
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter scans by target CIDR, user, or probe type..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
        >
          <option value="All">All Statuses ({scans.length})</option>
          <option value="Completed">Completed</option>
          <option value="Running">Running</option>
          <option value="Paused">Paused</option>
          <option value="Failed">Failed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Scans Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <LoadingSkeleton rows={6} />
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Network className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <div className="font-semibold text-slate-700">No scan history recorded</div>
            <p className="text-[11px] text-slate-400 mt-1">Execute a subnet scan from the scanner console to populate history.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Target CIDR</th>
                  <th className="p-2.5">Scan Type</th>
                  <th className="p-2.5">Port Set</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-center">Hosts Found</th>
                  <th className="p-2.5">Operator</th>
                  <th className="p-2.5">Started At</th>
                  <th className="p-2.5">Completed At</th>
                  <th className="p-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-slate-900">{scan.targetCidr}</td>
                    <td className="p-2.5 font-semibold text-slate-700">{scan.scanType}</td>
                    <td className="p-2.5 font-mono text-slate-600">{scan.portSet}</td>
                    <td className="p-2.5 text-center">
                      <StatusBadge status={scan.status} size="sm" />
                    </td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">
                      {scan.hostsFound} / {scan.hostsTotal}
                    </td>
                    <td className="p-2.5 text-slate-700 font-medium">{scan.createdBy}</td>
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                      {scan.startedAt ? new Date(scan.startedAt).toLocaleString() : '—'}
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                      {scan.completedAt ? new Date(scan.completedAt).toLocaleString() : '—'}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/discovery/scans/${scan.id}`)}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#2F3EA0] hover:bg-blue-50 border border-blue-200 rounded"
                        >
                          <ExternalLink className="h-3 w-3" /> View Detail
                        </button>

                        <button
                          onClick={() => window.open(discoveryApi.exportScanUrl(scan.id, 'csv'), '_blank')}
                          title="Export CSV"
                          className="p-1 text-slate-600 hover:text-slate-900 border border-slate-300 rounded hover:bg-slate-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
