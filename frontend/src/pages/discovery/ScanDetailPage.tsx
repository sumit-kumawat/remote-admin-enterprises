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
import { toast } from '../../store/useToastStore';
import {
  ArrowLeft,
  Pause,
  RotateCcw,
  XCircle,
  Download,
  Search,
  AlertTriangle,
  ShieldCheck,
  X,
  Network,
  CheckSquare,
  Square,
  Copy,
  Check,
} from 'lucide-react';

export const ScanDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // SignalR Hook
  const { connectionStatus, flashedHostIds } = useDiscoveryHub(id);

  // Queries & Mutations
  const { data: scan, isLoading: isScanLoading } = useScan(id);
  const { data: hosts = [], isLoading: isHostsLoading, refetch: refetchHosts } = useScanHosts(id);

  const pauseMutation = usePauseScan();
  const resumeMutation = useResumeScan();
  const cancelMutation = useCancelScan();
  const promoteMutation = usePromoteHost();

  // Selection & Clipboard
  const [selectedHostIds, setSelectedHostIds] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isBulkPromoting, setIsBulkPromoting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Up' | 'Down' | 'Filtered'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Windows' | 'Linux' | 'Network'>('All');
  const [hasOpenPortsFilter, setHasOpenPortsFilter] = useState(false);
  const [vendorFilter, setVendorFilter] = useState<string>('All');

  // Selected Host for Side Drawer
  const [selectedHost, setSelectedHost] = useState<DiscoveryHostDto | null>(null);

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

  // Selection state
  const isAllSelected = filteredHosts.length > 0 && selectedHostIds.length === filteredHosts.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedHostIds([]);
    } else {
      setSelectedHostIds(filteredHosts.map((h) => h.id));
    }
  };

  const toggleSelectHost = (hostId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHostIds((prev) =>
      prev.includes(hostId) ? prev.filter((id) => id !== hostId) : [...prev, hostId]
    );
  };

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
    promoteMutation.mutate(host.id, {
      onSuccess: () => {
        toast.success('Host Promoted', `Discovered host ${host.ipAddress} promoted to managed endpoint.`);
        refetchHosts();
      },
      onError: (err: any) => {
        toast.error('Promotion Failed', err?.response?.data?.message || 'Failed to promote host');
      },
    });
  };

  const handleBulkPromoteSelected = async () => {
    if (selectedHostIds.length === 0) return;
    setIsBulkPromoting(true);
    try {
      await discoveryApi.bulkPromoteHosts(selectedHostIds);
      toast.success('Bulk Promotion Complete', `${selectedHostIds.length} hosts promoted to managed endpoints.`);
      setSelectedHostIds([]);
      refetchHosts();
    } catch (err: any) {
      toast.error('Bulk Promotion Failed', err?.response?.data?.message || 'Some hosts failed to promote');
    } finally {
      setIsBulkPromoting(false);
    }
  };

  const handleExportSelected = () => {
    const selectedHostsData = filteredHosts.filter((h) => selectedHostIds.includes(h.id));
    if (selectedHostsData.length === 0) return;

    let csvContent = 'IP Address,Hostname,MAC Address,Vendor,TTL,OS Guess,Status,Confidence\n';
    selectedHostsData.forEach((h) => {
      csvContent += `"${h.ipAddress}","${h.hostname || ''}","${h.macAddress || ''}","${h.vendor || ''}","${h.ttl || ''}","${h.osGuess || ''}","${h.status}","${h.confidence}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `selected-discovered-hosts-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(`${label}-${text}`);
    toast.success('Copied', `${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
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
            className="mt-3 px-3 py-1.5 text-xs bg-[#2F3EA0] text-white rounded font-medium cursor-pointer"
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
              className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded cursor-pointer"
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </button>
            )}
            {scan.status === 'Paused' && (
              <button
                onClick={() => resumeMutation.mutate(scan.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Resume
              </button>
            )}
            {(scan.status === 'Running' || scan.status === 'Queued' || scan.status === 'Paused') && (
              <button
                onClick={() => cancelMutation.mutate(scan.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-red-100 hover:bg-red-200 border border-red-300 rounded cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            )}

            <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded cursor-pointer"
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

      {/* Toolbar & Bulk Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by IP, Hostname, MAC, Vendor, OS..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded font-sans focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          {/* Bulk Action Controls */}
          {selectedHostIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded text-blue-900 font-semibold animate-in fade-in">
              <span className="text-xs">{selectedHostIds.length} Selected</span>
              <button
                onClick={handleBulkPromoteSelected}
                disabled={isBulkPromoting}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {isBulkPromoting ? 'Promoting...' : `Promote Selected (${selectedHostIds.length})`}
              </button>
              <button
                onClick={handleExportSelected}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#2F3EA0]" /> Export CSV
              </button>
              <button
                onClick={() => setSelectedHostIds([])}
                className="text-xs text-slate-500 hover:text-slate-800 ml-1 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
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

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            >
              <option value="All">All OS Types</option>
              <option value="Windows">Windows Hosts</option>
              <option value="Linux">Linux / Unix</option>
              <option value="Network">Network Gear</option>
            </select>

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

            <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer border border-slate-300 rounded px-2 py-1.5 bg-slate-50 hover:bg-slate-100">
              <input
                type="checkbox"
                checked={hasOpenPortsFilter}
                onChange={(e) => setHasOpenPortsFilter(e.target.checked)}
                className="accent-[#2F3EA0] h-3.5 w-3.5 rounded"
              />
              <span>Has Open Ports</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Table (Matching Endpoints Table Style with Single-Word Headers) */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 flex justify-between items-center text-xs">
          <span>
            Discovered Hosts ({filteredHosts.length} of {hosts.length}) {selectedHostIds.length > 0 && `— ${selectedHostIds.length} Selected`}
          </span>
          <span className="text-[11px] text-slate-500 font-normal">
            Click row for details • Select rows for bulk action
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
              {/* Single-Word Column Titles matching Endpoints style */}
              <div className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 flex text-left text-xs">
                <div className="p-2.5 w-10 shrink-0 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-[#2F3EA0]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
                <div className="p-2.5 w-32 shrink-0">IP</div>
                <div className="p-2.5 w-44 shrink-0">Host</div>
                <div className="p-2.5 w-36 shrink-0">MAC</div>
                <div className="p-2.5 w-36 shrink-0">Vendor</div>
                <div className="p-2.5 w-14 shrink-0 text-center">TTL</div>
                <div className="p-2.5 w-36 shrink-0">OS</div>
                <div className="p-2.5 w-44 shrink-0">Ports</div>
                <div className="p-2.5 w-16 shrink-0 text-center">Conf</div>
                <div className="p-2.5 w-20 shrink-0 text-center">Status</div>
                <div className="p-2.5 w-24 shrink-0">Seen</div>
                <div className="p-2.5 w-28 shrink-0 text-right">Action</div>
              </div>

              {/* Table Rows */}
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const host = filteredHosts[virtualRow.index];
                const isSelected = selectedHostIds.includes(host.id);
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
                    className={`flex items-center text-xs border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${
                      isSelected ? 'bg-blue-50/60 font-medium' : isFlashed ? 'bg-amber-100 animate-pulse font-bold' : 'bg-white'
                    }`}
                  >
                    {/* Checkbox Column */}
                    <div className="p-2.5 w-10 shrink-0 text-center" onClick={(e) => toggleSelectHost(host.id, e)}>
                      <button className="text-slate-500 hover:text-slate-900 cursor-pointer">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#2F3EA0]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300" />
                        )}
                      </button>
                    </div>

                    {/* IP Column */}
                    <div className="p-2.5 w-32 shrink-0 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1">
                        <span>{host.ipAddress}</span>
                        <button
                          onClick={(e) => handleCopyToClipboard(host.ipAddress, 'IP', e)}
                          title="Copy IP"
                          className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        >
                          {copiedField === `IP-${host.ipAddress}` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Host Column */}
                    <div className="p-2.5 w-44 shrink-0 truncate font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <DeviceIcon osName={host.osGuess || undefined} size={14} />
                        <span className="truncate">{host.hostname || '—'}</span>
                      </div>
                    </div>

                    {/* MAC Column */}
                    <div className="p-2.5 w-36 shrink-0 font-mono text-slate-600 truncate">{host.macAddress || '—'}</div>

                    {/* Vendor Column */}
                    <div className="p-2.5 w-36 shrink-0 text-slate-700 truncate">{host.vendor || 'Unknown'}</div>

                    {/* TTL Column */}
                    <div className="p-2.5 w-14 shrink-0 font-mono text-center text-slate-600">{host.ttl ?? '—'}</div>

                    {/* OS Column */}
                    <div className="p-2.5 w-36 shrink-0 text-slate-800 font-medium truncate">
                      {host.osGuess || 'Unknown OS'}
                    </div>

                    {/* Ports Column */}
                    <div className="p-2.5 w-44 shrink-0 font-mono text-[11px] truncate">
                      {openPorts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {openPorts.slice(0, 3).map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                              {p}
                            </span>
                          ))}
                          {openPorts.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-sans">+{openPorts.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </div>

                    {/* Conf Column */}
                    <div className="p-2.5 w-16 shrink-0 text-center font-bold text-slate-700">
                      {host.confidence}%
                    </div>

                    {/* Status Column */}
                    <div className="p-2.5 w-20 shrink-0 text-center">
                      <StatusBadge status={host.status === 'Up' ? 'Online' : host.status === 'Down' ? 'Offline' : 'Warning'} size="sm" />
                    </div>

                    {/* Seen Column */}
                    <div className="p-2.5 w-24 shrink-0 text-slate-500 font-mono text-[11px]">
                      {new Date(host.firstSeenAt).toLocaleTimeString()}
                    </div>

                    {/* Action Column */}
                    <div className="p-2.5 w-28 shrink-0 text-right" onClick={(e) => e.stopPropagation()}>
                      {host.isPromoted ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <ShieldCheck className="h-3.5 w-3.5" /> Promoted
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handlePromoteSingle(host, e)}
                          disabled={promoteMutation.isPending || host.status !== 'Up'}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs cursor-pointer disabled:opacity-40"
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
                  {selectedHost.ipAddress}
                  {selectedHost.hostname && <span className="text-slate-500 font-normal">({selectedHost.hostname})</span>}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  MAC: {selectedHost.macAddress || 'N/A'} | Vendor: {selectedHost.vendor || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => setSelectedHost(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                <div>
                  <span className="text-slate-500 block text-[10px]">OS Guess</span>
                  <span className="font-semibold text-slate-800">{selectedHost.osGuess || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">TTL Value</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedHost.ttl ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Confidence</span>
                  <span className="font-bold text-slate-900">{selectedHost.confidence}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Status</span>
                  <StatusBadge status={selectedHost.status === 'Up' ? 'Online' : 'Offline'} size="sm" />
                </div>
              </div>

              {/* Open Ports List */}
              {(() => {
                let drawerPorts: number[] = [];
                try {
                  if (selectedHost.openPortsJson) drawerPorts = JSON.parse(selectedHost.openPortsJson);
                } catch {}

                let drawerBanners: Record<string, string> = {};
                try {
                  if (selectedHost.bannersJson) drawerBanners = JSON.parse(selectedHost.bannersJson);
                } catch {}

                return (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2">Discovered Open Ports & Services</h3>
                    {drawerPorts.length > 0 ? (
                      <div className="space-y-2">
                        {drawerPorts.map((port: number) => {
                          const banner = drawerBanners[port] || drawerBanners[String(port)];
                          return (
                            <div key={port} className="p-2 border border-slate-200 rounded bg-slate-50">
                              <div className="flex justify-between items-center font-mono text-xs">
                                <span className="font-bold text-[#2F3EA0]">Port {port}</span>
                                <span className="text-[10px] text-slate-500">TCP</span>
                              </div>
                              {banner && (
                                <div className="mt-1 text-[11px] font-mono text-slate-600 bg-white p-1.5 rounded border border-slate-200 break-all select-text">
                                  {banner}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-slate-500 italic border border-slate-200 rounded bg-slate-50">
                        No open TCP ports detected during probe.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => setSelectedHost(null)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium cursor-pointer"
              >
                Close
              </button>

              {!selectedHost.isPromoted && (
                <button
                  onClick={(e) => {
                    handlePromoteSingle(selectedHost, e);
                    setSelectedHost(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" /> Promote to Endpoint
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
