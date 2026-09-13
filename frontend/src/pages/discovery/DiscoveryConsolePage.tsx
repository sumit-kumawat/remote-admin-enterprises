import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useSubnets,
  useScans,
  useCreateScan,
  usePauseScan,
  useResumeScan,
  useCancelScan,
} from '../../hooks/useDiscovery';
import { useDiscoveryHub } from '../../hooks/useDiscoveryHub';
import { DiscoverySubnav } from './DiscoverySubnav';
import type { ScanType, EventSeverity } from '../../types/discovery';
import {
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Network,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Activity,
  Terminal,
  Server,
  Zap,
  AlertTriangle,
} from 'lucide-react';

export const DiscoveryConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: subnets = [] } = useSubnets();
  const { data: scans = [] } = useScans();
  const createScanMutation = useCreateScan();
  const pauseScanMutation = usePauseScan();
  const resumeScanMutation = useResumeScan();
  const cancelScanMutation = useCancelScan();

  const { connectionStatus, events, clearEvents } = useDiscoveryHub();

  // Form State
  const [targetCidr, setTargetCidr] = useState('192.168.100.0/24');
  const [scanType, setScanType] = useState<ScanType>('Full');
  const [portSet, setPortSet] = useState('Windows');
  const [customPorts, setCustomPorts] = useState('');
  const [concurrency, setConcurrency] = useState(500);
  const [timeoutMs, setTimeoutMs] = useState(2000);
  const [rateLimitPps, setRateLimitPps] = useState(5000);
  const [confirmedOwnership, setConfirmedOwnership] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Log filter
  const [logSeverityFilter, setLogSeverityFilter] = useState<'All' | EventSeverity>('All');

  // Validation Error
  const [formError, setFormError] = useState<string | null>(null);

  const handleQuickPickCidr = (cidr: string) => {
    setTargetCidr(cidr);
    setFormError(null);
  };

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!targetCidr.trim()) {
      setFormError('Please provide a target subnet CIDR (e.g. 192.168.1.0/24).');
      return;
    }

    if (!confirmedOwnership) {
      setFormError('You must acknowledge network ownership and authorization before scanning.');
      return;
    }

    const effectivePortSet = portSet === 'Custom' ? customPorts : portSet;

    createScanMutation.mutate(
      {
        targetCidr: targetCidr.trim(),
        scanType,
        portSet: effectivePortSet,
        concurrency,
        timeoutMs,
        rateLimitPps,
        confirmedOwnership,
      },
      {
        onSuccess: (scan) => {
          navigate(`/discovery/scans/${scan.id}`);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to start scan';
          setFormError(msg);
        },
      }
    );
  };

  const safeScans = Array.isArray(scans) ? scans : [];
  const safeSubnets = Array.isArray(subnets) ? subnets : [];
  const safeEvents = Array.isArray(events) ? events : [];

  // Filtered Events
  const filteredEvents = safeEvents.filter((ev) => {
    if (logSeverityFilter !== 'All' && ev.severity !== logSeverityFilter) return false;
    return true;
  });

  const activeScans = safeScans.filter((s) => s.status === 'Running' || s.status === 'Queued' || s.status === 'Paused');
  const totalHostsFound = safeScans.reduce((acc, s) => acc + (s.hostsFound || 0), 0);

  return (
    <div className="space-y-4 text-xs font-sans">
      <DiscoverySubnav connectionStatus={connectionStatus} />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 border border-slate-200 rounded-md shadow-xs gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-[#2F3EA0]" />
            Enterprise Real-Time Subnet Scanner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Probe air-gapped single subnet ranges live via multi-protocol ARP/ICMP/TCP layer probes with real-time SignalR streaming.
          </p>
        </div>
      </div>

      {/* Main Grid: Form Left, Activity Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel - Scan Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-md shadow-xs p-4 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-[#2F3EA0]" />
                Initiate New Subnet Scan
              </h2>
              <p className="text-[11px] text-slate-500">Configure target range, probe methods, and rate limits.</p>
            </div>

            <form onSubmit={handleStartScan} className="space-y-4">
              {/* Target CIDR Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Target Single Subnet CIDR <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Network className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={targetCidr}
                    onChange={(e) => {
                      setTargetCidr(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="e.g. 192.168.100.0/24"
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded font-mono focus:outline-none focus:ring-2 focus:ring-[#2F3EA0] bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* Quick Pick Subnet Chips */}
                {safeSubnets.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-slate-500 font-medium">Quick Pick Local Subnets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {safeSubnets.map((sub) => (
                        <button
                          key={sub.cidr}
                          type="button"
                          onClick={() => handleQuickPickCidr(sub.cidr)}
                          className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                            targetCidr === sub.cidr
                              ? 'bg-[#2F3EA0] text-white border-[#2F3EA0]'
                              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {sub.cidr} ({sub.name})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 block mt-1">
                  Max prefix cap: <strong>/22</strong> (1022 hosts max). Must be a single subnet block.
                </span>
              </div>

              {/* Scan Type Radio Group */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Scan Probe Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Full', label: 'Full (ARP + Ping + TCP)', desc: 'Comprehensive probe' },
                    { id: 'ARP', label: 'ARP Only', desc: 'L2 local segment' },
                    { id: 'ICMP', label: 'ICMP Ping Only', desc: 'Layer 3 ping' },
                    { id: 'TCP', label: 'TCP Port Sweep', desc: 'Common port check' },
                  ].map((type) => (
                    <label
                      key={type.id}
                      className={`flex flex-col p-2 border rounded cursor-pointer transition-all ${
                        scanType === type.id
                          ? 'border-[#2F3EA0] bg-blue-50/50 text-slate-900 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name="scanType"
                          checked={scanType === type.id}
                          onChange={() => setScanType(type.id as ScanType)}
                          className="accent-[#2F3EA0]"
                        />
                        <span>{type.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 ml-5">{type.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Port Set Chips */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Target Port Set</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Windows', 'Web', 'SSH', 'Database', 'AllCommon', 'Custom'].map((set) => (
                    <button
                      key={set}
                      type="button"
                      onClick={() => setPortSet(set)}
                      className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                        portSet === set
                          ? 'bg-[#2F3EA0] text-white border-[#2F3EA0]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {set}
                    </button>
                  ))}
                </div>
                {portSet === 'Custom' && (
                  <input
                    type="text"
                    value={customPorts}
                    onChange={(e) => setCustomPorts(e.target.value)}
                    placeholder="Comma separated ports e.g. 80, 443, 8080"
                    className="mt-2 w-full px-2.5 py-1 text-xs border border-slate-300 rounded font-mono"
                  />
                )}
              </div>

              {/* Advanced Settings Accordion Drawer */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-slate-500" />
                    Advanced Controls (Concurrency & Rate Limiting)
                  </span>
                  {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {showAdvanced && (
                  <div className="p-3 bg-white space-y-3 text-xs border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium">
                        TCP Concurrency Limit (SemaphoreSlim): {concurrency}
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="2000"
                        step="50"
                        value={concurrency}
                        onChange={(e) => setConcurrency(parseInt(e.target.value))}
                        className="w-full accent-[#2F3EA0]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-600 font-medium">Probe Timeout (ms)</label>
                        <input
                          type="number"
                          value={timeoutMs}
                          onChange={(e) => setTimeoutMs(parseInt(e.target.value) || 1000)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 font-medium">Rate Limit (pps)</label>
                        <input
                          type="number"
                          value={rateLimitPps}
                          onChange={(e) => setRateLimitPps(parseInt(e.target.value) || 1000)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Ownership Confirmation Checkbox (Mandatory Guard) */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedOwnership}
                    onChange={(e) => {
                      setConfirmedOwnership(e.target.checked);
                      setFormError(null);
                    }}
                    className="mt-0.5 accent-[#2F3EA0] h-4 w-4 rounded"
                  />
                  <div className="text-[11px] text-amber-900 font-medium">
                    <span className="font-bold flex items-center gap-1 text-amber-950">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                      Ownership & Authorization Acknowledgment
                    </span>
                    I confirm that I possess explicit authorization and ownership to execute network probes on CIDR{' '}
                    <span className="font-mono font-bold">{targetCidr || '[Target]'}</span>.
                  </div>
                </label>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Start Button */}
              <button
                type="submit"
                disabled={createScanMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs transition-colors disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {createScanMutation.isPending ? 'Initializing Subnet Probe...' : 'Execute Real-Time Subnet Scan'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel - Live Activity & Scans (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Summary Counter Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 border border-slate-200 rounded-md shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Total Scans</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{safeScans.length}</div>
            </div>
            <div className="bg-white p-3 border border-slate-200 rounded-md shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Active Scans</div>
              <div className="text-xl font-bold text-blue-700 mt-1">{activeScans.length}</div>
            </div>
            <div className="bg-white p-3 border border-slate-200 rounded-md shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Total Hosts Found</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">{totalHostsFound}</div>
            </div>
            <div className="bg-white p-3 border border-slate-200 rounded-md shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">SignalR Stream</div>
              <div className="text-xl font-bold text-slate-800 mt-1 capitalize">{connectionStatus}</div>
            </div>
          </div>

          {/* Active Scans Section */}
          {activeScans.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-md shadow-xs p-4 space-y-3">
              <h3 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-[#2F3EA0] animate-spin" />
                  Currently Executing Subnet Scans ({activeScans.length})
                </span>
              </h3>

              <div className="space-y-3">
                {activeScans.map((scan) => (
                  <div key={scan.id} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 font-mono text-xs">{scan.targetCidr}</span>
                        <span className="text-slate-500 ml-2 text-[11px]">({scan.scanType})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/discovery/scans/${scan.id}`)}
                          className="px-2 py-0.5 text-[11px] font-semibold bg-[#2F3EA0] text-white rounded hover:bg-[#233080]"
                        >
                          View Live Results
                        </button>
                        {scan.status === 'Running' && (
                          <button
                            onClick={() => pauseScanMutation.mutate(scan.id)}
                            title="Pause Scan"
                            className="p-1 text-amber-700 hover:bg-amber-100 rounded"
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {scan.status === 'Paused' && (
                          <button
                            onClick={() => resumeScanMutation.mutate(scan.id)}
                            title="Resume Scan"
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => cancelScanMutation.mutate(scan.id)}
                          title="Cancel Scan"
                          className="p-1 text-red-700 hover:bg-red-100 rounded"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>Progress: {scan.progressPercent.toFixed(1)}%</span>
                        <span>
                          {scan.hostsFound} / {scan.hostsTotal} Hosts Discovered
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#2F3EA0] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, scan.progressPercent))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monospace Live Log Stream via SignalR */}
          <div className="bg-slate-900 border border-slate-800 rounded-md shadow-xs overflow-hidden flex flex-col h-[400px]">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-slate-200">Live SignalR Event Console Stream</span>
                <span className="text-[10px] text-slate-500">({events.length} events)</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={logSeverityFilter}
                  onChange={(e) => setLogSeverityFilter(e.target.value as any)}
                  className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-700 focus:outline-none"
                >
                  <option value="All">All Severities</option>
                  <option value="Info">Info</option>
                  <option value="Success">Success</option>
                  <option value="Warning">Warning</option>
                  <option value="Error">Error</option>
                </select>

                <button
                  onClick={clearEvents}
                  className="text-[10px] text-slate-400 hover:text-slate-200 border border-slate-700 px-2 py-0.5 rounded"
                >
                  Clear Log
                </button>
              </div>
            </div>

            <div className="p-3 font-mono text-[11px] text-slate-300 flex-1 overflow-y-auto space-y-1 select-text">
              {filteredEvents.length === 0 ? (
                <div className="text-slate-600 text-center py-10 italic">
                  No live events received yet. Initiate a scan to stream probe events live.
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const severityColor =
                    ev.severity === 'Success'
                      ? 'text-emerald-400'
                      : ev.severity === 'Warning'
                      ? 'text-amber-400'
                      : ev.severity === 'Error'
                      ? 'text-red-400'
                      : 'text-blue-400';

                  return (
                    <div key={ev.id || Math.random()} className="flex items-start gap-2 hover:bg-slate-800/50 p-0.5 rounded">
                      <span className="text-slate-500 shrink-0">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      <span className={`font-bold shrink-0 w-14 ${severityColor}`}>[{ev.severity}]</span>
                      <span className="text-slate-200 break-all">{ev.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
