import React, { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVirtualList } from '../../hooks/useVirtualList';
import {
  useScan,
  useScanHosts,
  usePauseScan,
  useResumeScan,
  useCancelScan,
  usePromoteHost,
} from '../../hooks/useDiscovery';
import { useDiscoveryHub } from '../../hooks/useDiscoveryHub';
import { discoveryApi } from '../../api/discoveryApi';
import { DiscoverySubnav } from './DiscoverySubnav';
import type { DiscoveryHostDto } from '../../types/discovery';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { DeviceIcon } from '../../components/common/DeviceIcon';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  Pause,
  RotateCcw,
  XCircle,
  Download,
  Search,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Plus,
  X,
  Network,
} from 'lucide-react';

export const ScanDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // SignalR Hook
  const { connectionStatus, flashedHostIds } = useDiscoveryHub(id);

  // Queries & Mutations
  const { data: scan, isLoading: isScanLoading } = useScan(id);
  const { data: hosts = [], isLoading: isHostsLoading } = useScanHosts(id);

  const pauseMutation = usePauseScan();
  const resumeMutation = useResumeScan();
  const cancelMutation = useCancelScan();
  const promoteMutation = usePromoteHost();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Up' | 'Down' | 'Filtered'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Windows' | 'Linux' | 'Network'>('All');
  const [hasOpenPortsFilter, setHasOpenPortsFilter] = useState(false);
  const [vendorFilter, setVendorFilter] = useState<string>('All');

  // Selected Host for Side Drawer
  const [selectedHost, setSelectedHost] = useState<DiscoveryHostDto | null>(null);

  // Bulk Promote Modal
  const [showBulkPromoteModal, setShowBulkPromoteModal] = useState(false);
  const [bulkPromoteStatus, setBulkPromoteStatus] = useState<string | null>(null);

  // Unique Vendors list
  const uniqueVendors = useMemo(() => {
    const list = Array.from(new Set(hosts.map((h) => h.vendor).filter(Boolean))) as string[];
    return list.sort();
  }, [hosts]);

  // Filtered Hosts
  const filteredHosts = useMemo(() => {
    return hosts.filter((host) => {
      // Status Filter
      if (statusFilter !== 'All' && host.status !== statusFilter) return false;

      // Type Filter
      if (typeFilter === 'Windows') {
        const isWin = host.osGuess?.toLowerCase().includes('windows') || (host.ttl && host.ttl > 100 && host.ttl <= 128);
        if (!isWin) return false;
      } else if (typeFilter === 'Linux') {
        const isLin = host.osGuess?.toLowerCase().includes('linux') || host.osGuess?.toLowerCase().includes('unix') || (host.ttl && host.ttl <= 64);
        if (!isLin) return false;
      } else if (typeFilter === 'Network') {
        const isNet = host.osGuess?.toLowerCase().includes('network') || (host.ttl && host.ttl > 128);
        if (!isNet) return false;
      }

      // Has Open Ports
      if (hasOpenPortsFilter) {
        let ports: number[] = [];
        try {
          if (host.openPortsJson) ports = JSON.parse(host.openPortsJson);
        } catch {}
        if (ports.length === 0) return false;
      }

      // Vendor Filter
      if (vendorFilter !== 'All' && host.vendor !== vendorFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesIp = host.ipAddress.toLowerCase().includes(q);
        const matchesHost = host.hostname?.toLowerCase().includes(q);
        const matchesMac = host.macAddress?.toLowerCase().includes(q);
        const matchesVendor = host.vendor?.toLowerCase().includes(q);
        const matchesOs = host.osGuess?.toLowerCase().includes(q);
        if (!matchesIp && !matchesHost && !matchesMac && !matchesVendor && !matchesOs) return false;
      }

      return true;
    });
  }, [hosts, statusFilter, typeFilter, hasOpenPortsFilter, vendorFilter, searchQuery]);

  // Virtualizer setup for 10k+ rows
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualList({
    count: filteredHosts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const handleExport = (format: 'csv' | 'json') => {
    const url = discoveryApi.exportScanUrl(id, format);
    window.open(url, '_blank');
  };

  const handlePromoteSingle = (host: DiscoveryHostDto, e: React.MouseEvent) => {
    e.stopPropagation();
    promoteMutation.mutate(host.id);
  };

  const handleBulkPromote = async () => {
    const promotable = filteredHosts.filter((h) => h.status === 'Up' && !h.isPromoted);
    setBulkPromoteStatus(`Promoting ${promotable.length} discovered hosts into managed endpoints...`);

    let count = 0;
    for (const host of promotable) {
      try {
        await promoteMutation.mutateAsync(host.id);
        count++;
      } catch (err) {
        console.error(`Failed to promote host ${host.ipAddress}`, err);
      }
    }

    setBulkPromoteStatus(`Successfully promoted ${count} of ${promotable.length} hosts!`);
    setTimeout(() => {
      setShowBulkPromoteModal(false);
      setBulkPromoteStatus(null);
    }, 1500);
  };

  if (isScanLoading) {
    return (
      <div className="space-y-4 text-xs font-sans">
        <DiscoverySubnav />
        <LoadingSkeleton rows={10} />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="space-y-4 text-xs font-sans">
        <DiscoverySubnav />
        <div className="p-8 text-center bg-white border border-slate-200 rounded-md">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <h2 className="text-sm font-bold text-slate-800">Scan Not Found</h2>
          <button
            onClick={() => navigate('/discovery/scans')}
            className="mt-3 px-3 py-1.5 text-xs bg-[#2F3EA0] text-white rounded font-medium"
          >
            Back to Scan History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs font-sans">
      <DiscoverySubnav connectionStatus={connectionStatus} />

      {/* Top Header Card */}
      <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/discovery/scans')}
              className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100"
              title="Back to Scans"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 font-mono">{scan.targetCidr}</h1>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {scan.scanType}
                </span>
                <StatusBadge status={scan.status} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Scan ID: <span className="font-mono">{scan.id}</span> | Created By:{' '}
                <span className="font-semibold">{scan.createdBy}</span> | Port Set:{' '}
                <span className="font-mono">{scan.portSet}</span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {scan.status === 'Running' && (
              <button
                onClick={() => pauseMutation.mutate(scan.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded"
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </button>
            )}
            {scan.status === 'Paused' && (
              <button
                onClick={() => resumeMutation.mutate(scan.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Resume
              </button>
            )}
            {(scan.status === 'Running' || scan.status === 'Queued' || scan.status === 'Paused') && (
              <button
                onClick={() => cancelMutation.mutate(scan.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-red-100 hover:bg-red-200 border border-red-300 rounded"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            )}

            <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded"
            >
              <Download className="h-3.5 w-3.5" /> Export JSON
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-medium">
            <span>Scan Progress: {scan.progressPercent.toFixed(1)}%</span>
            <span>
              {scan.hostsFound} Discovered / {scan.hostsTotal} Total Subnet Addresses
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                scan.status === 'Completed'
                  ? 'bg-emerald-600'
                  : scan.status === 'Failed' || scan.status === 'Cancelled'
                  ? 'bg-red-600'
                  : 'bg-[#2F3EA0]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, scan.progressPercent))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IP, Hostname, MAC address, Vendor..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded font-sans focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            >
              <option value="All">All Statuses ({hosts.length})</option>
              <option value="Up">Up ({hosts.filter((h) => h.status === 'Up').length})</option>
              <option value="Down">Down ({hosts.filter((h) => h.status === 'Down').length})</option>
              <option value="Filtered">Filtered ({hosts.filter((h) => h.status === 'Filtered').length})</option>
            </select>

            {/* Device Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            >
              <option value="All">All Device Types</option>
              <option value="Windows">Windows Hosts</option>
              <option value="Linux">Linux / Unix</option>
              <option value="Network">Network Gear</option>
            </select>

            {/* Vendor Filter */}
            {uniqueVendors.length > 0 && (
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
              >
                <option value="All">All Vendors</option>
                {uniqueVendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            )}

            {/* Checkbox: Has Open Ports */}
            <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer border border-slate-300 rounded px-2 py-1.5 bg-slate-50 hover:bg-slate-100">
              <input
                type="checkbox"
                checked={hasOpenPortsFilter}
                onChange={(e) => setHasOpenPortsFilter(e.target.checked)}
                className="accent-[#2F3EA0] h-3.5 w-3.5 rounded"
              />
              <span>Has Open Ports</span>
            </label>

            {/* Bulk Promote Action Button */}
            <button
              onClick={() => setShowBulkPromoteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Promote Matching ({filteredHosts.filter((h) => h.status === 'Up' && !h.isPromoted).length})
            </button>
          </div>
        </div>
      </div>

      {/* Results Table (Virtualized handling 10,000+ rows) */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 flex justify-between items-center">
          <span>
            Discovered Hosts ({filteredHosts.length} of {hosts.length})
          </span>
          <span className="text-[11px] text-slate-500 font-normal">
            Click any row to open Host Metadata & Banner Details drawer
          </span>
        </div>

        {isHostsLoading ? (
          <div className="p-4">
            <LoadingSkeleton rows={8} />
          </div>
        ) : filteredHosts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Network className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <div className="font-semibold text-slate-700">No hosts match current filters</div>
            <p className="text-[11px] text-slate-400 mt-1">Try resetting search parameters or selecting another status filter.</p>
          </div>
        ) : (
          <div ref={parentRef} className="h-[550px] overflow-auto relative">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {/* Table Header */}
              <div className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 flex text-left text-xs uppercase tracking-wider">
                <div className="p-2.5 w-32 shrink-0">IP Address</div>
                <div className="p-2.5 w-44 shrink-0">Hostname / Reverse DNS</div>
                <div className="p-2.5 w-36 shrink-0">MAC Address</div>
                <div className="p-2.5 w-36 shrink-0">IEEE Vendor</div>
                <div className="p-2.5 w-16 shrink-0 text-center">TTL</div>
                <div className="p-2.5 w-36 shrink-0">OS Guess</div>
                <div className="p-2.5 w-48 shrink-0">Open Ports</div>
                <div className="p-2.5 w-20 shrink-0 text-center">Conf.</div>
                <div className="p-2.5 w-24 shrink-0 text-center">Status</div>
                <div className="p-2.5 w-32 shrink-0">First Seen</div>
                <div className="p-2.5 w-28 shrink-0 text-center">Action</div>
              </div>

              {/* Table Body Rows */}
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const host = filteredHosts[virtualRow.index];
                const isFlashed = flashedHostIds.has(host.id);

                let openPorts: number[] = [];
                try {
                  if (host.openPortsJson) openPorts = JSON.parse(host.openPortsJson);
                } catch {}

                return (
                  <div
                    key={host.id}
                    onClick={() => setSelectedHost(host)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`flex items-center text-xs border-b border-slate-100 cursor-pointer transition-colors hover:bg-blue-50/60 ${
                      isFlashed ? 'bg-amber-100 animate-pulse font-bold' : 'bg-white'
                    }`}
                  >
                    <div className="p-2.5 w-32 shrink-0 font-mono font-bold text-slate-900">{host.ipAddress}</div>
                    <div className="p-2.5 w-44 shrink-0 truncate font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <DeviceIcon osName={host.osGuess || undefined} size={14} />
                        <span className="truncate">{host.hostname || '—'}</span>
                      </div>
                    </div>
                    <div className="p-2.5 w-36 shrink-0 font-mono text-slate-600 truncate">{host.macAddress || '—'}</div>
                    <div className="p-2.5 w-36 shrink-0 text-slate-700 truncate">{host.vendor || 'Unknown'}</div>
                    <div className="p-2.5 w-16 shrink-0 font-mono text-center text-slate-600">{host.ttl ?? '—'}</div>
                    <div className="p-2.5 w-36 shrink-0 text-slate-800 font-medium truncate">
                      {host.osGuess || 'Unknown OS'}
                    </div>
                    <div className="p-2.5 w-48 shrink-0 font-mono text-[11px] truncate">
                      {openPorts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {openPorts.slice(0, 4).map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                              {p}
                            </span>
                          ))}
                          {openPorts.length > 4 && (
                            <span className="text-[10px] text-slate-400 font-sans">+{openPorts.length - 4}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">None detected</span>
                      )}
                    </div>
                    <div className="p-2.5 w-20 shrink-0 text-center font-bold text-slate-700">
                      {host.confidence}%
                    </div>
                    <div className="p-2.5 w-24 shrink-0 text-center">
                      <StatusBadge status={host.status === 'Up' ? 'Online' : host.status === 'Down' ? 'Offline' : 'Warning'} size="sm" />
                    </div>
                    <div className="p-2.5 w-32 shrink-0 text-slate-500 font-mono text-[11px]">
                      {new Date(host.firstSeenAt).toLocaleTimeString()}
                    </div>
                    <div className="p-2.5 w-28 shrink-0 text-center">
                      {host.isPromoted ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <ShieldCheck className="h-3.5 w-3.5" /> Promoted
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handlePromoteSingle(host, e)}
                          disabled={promoteMutation.isPending || host.status !== 'Up'}
                          className="px-2 py-1 text-[11px] font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded disabled:opacity-40"
                        >
                          Promote
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Side Drawer for Selected Host Detail */}
      {selectedHost && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DeviceIcon osName={selectedHost.osGuess || undefined} size={18} />
                  Host Detail: {selectedHost.ipAddress}
                </h2>
                <p className="text-[11px] text-slate-500">{selectedHost.hostname || 'No reverse DNS record'}</p>
              </div>
              <button
                onClick={() => setSelectedHost(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Status & Promote Bar */}
              <div className="p-3 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Scan Classification</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={selectedHost.status === 'Up' ? 'Online' : 'Offline'} size="sm" />
                    <span className="font-bold text-slate-700">Confidence: {selectedHost.confidence}%</span>
                  </div>
                </div>

                {selectedHost.isPromoted ? (
                  <div className="px-3 py-1 bg-emerald-100 border border-emerald-300 rounded text-emerald-800 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> Promoted Managed Endpoint
                  </div>
                ) : (
                  <button
                    onClick={() => promoteMutation.mutate(selectedHost.id)}
                    disabled={promoteMutation.isPending || selectedHost.status !== 'Up'}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs disabled:opacity-50"
                  >
                    Promote to Endpoint
                  </button>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3 border border-slate-200 rounded">
                <div>
                  <span className="text-[10px] text-slate-500 block">IP Address</span>
                  <span className="font-mono font-bold text-slate-800">{selectedHost.ipAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">MAC Address</span>
                  <span className="font-mono text-slate-800">{selectedHost.macAddress || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">IEEE Vendor</span>
                  <span className="font-semibold text-slate-800">{selectedHost.vendor || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">TTL Response</span>
                  <span className="font-mono text-slate-800">{selectedHost.ttl ?? '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 block">OS Guess (Heuristic)</span>
                  <span className="font-semibold text-[#2F3EA0]">{selectedHost.osGuess || 'Unknown'}</span>
                </div>
              </div>

              {/* Open Ports & Raw Banners */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-xs">Captured TCP Port Banners</h3>
                <div className="p-3 bg-slate-900 text-slate-200 rounded font-mono text-[11px] overflow-x-auto max-h-48">
                  {selectedHost.bannersJson ? (
                    <pre className="whitespace-pre-wrap">{selectedHost.bannersJson}</pre>
                  ) : (
                    <span className="text-slate-500 italic">No TCP banner data captured during scan.</span>
                  )}
                </div>
              </div>

              {/* Enrichment Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#2F3EA0]" /> Live Host Enrichment Summary
                </div>
                <p className="text-[11px] text-blue-800">
                  Host was probed using multi-layer ARP/ICMP ping followed by TCP connect banners on common ports.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Promote Confirm Modal */}
      {showBulkPromoteModal && (
        <Modal isOpen={showBulkPromoteModal} onClose={() => setShowBulkPromoteModal(false)} title="Bulk Promote Discovered Hosts">
          <div className="space-y-4">
            <p className="text-xs text-slate-700">
              Are you sure you want to promote all <strong>{filteredHosts.filter((h) => h.status === 'Up' && !h.isPromoted).length}</strong> matching
              active hosts into managed inventory endpoints?
            </p>

            {bulkPromoteStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs font-semibold">
                {bulkPromoteStatus}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkPromoteModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPromote}
                disabled={!!bulkPromoteStatus}
                className="px-4 py-1.5 bg-[#2F3EA0] hover:bg-[#233080] text-white rounded text-xs font-bold disabled:opacity-50"
              >
                Confirm Bulk Promote
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
