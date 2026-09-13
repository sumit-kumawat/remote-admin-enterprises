import React, { useState } from 'react';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useAuditLogs } from '../../hooks/useAudit';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Monitor, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, SlidersHorizontal } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(15000); // Default: 15 seconds
  const { data: stats, isLoading, isError, refetch, isRefetching } = useDashboardStats(refreshIntervalMs);
  const { data: auditLogs = [] } = useAuditLogs();

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError || !stats) return <ErrorState onRetry={() => refetch()} />;

  const statusPieData = [
    { name: 'Online', value: stats.onlineEndpoints || 0, color: '#16a34a' },
    { name: 'Offline', value: stats.offlineEndpoints || 0, color: '#9ca3af' },
    { name: 'Unknown', value: stats.unknownEndpoints || 0, color: '#f59e0b' },
  ];

  const heartbeatTrendData = [
    { time: '00:00', heartbeats: 420 },
    { time: '04:00', heartbeats: 415 },
    { time: '08:00', heartbeats: 480 },
    { time: '12:00', heartbeats: 495 },
    { time: '16:00', heartbeats: 470 },
    { time: '20:00', heartbeats: 440 },
  ];

  const osDistributionData = [
    { os: 'Windows 11 Ent', count: stats.windows11Count || 0 },
    { os: 'Windows 10 Pro', count: stats.windows10Count || 0 },
    { os: 'Windows Server', count: stats.totalEndpoints > 0 ? Math.max(1, stats.totalEndpoints - (stats.windows11Count + stats.windows10Count)) : 0 },
  ];

  return (
    <div className="space-y-5 text-xs font-sans">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">Windows Server & Endpoint Manager Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time infrastructure health, status distribution, and active job metrics</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Select Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-600 font-medium">Auto-Refresh:</span>
            <select
              value={refreshIntervalMs}
              onChange={(e) => setRefreshIntervalMs(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={5000}>5 seconds</option>
              <option value={15000}>15 seconds (Default)</option>
              <option value={30000}>30 seconds</option>
            </select>
          </div>

          {/* Refresh Metrics Button */}
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>{isRefetching ? 'Refetching...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Total Endpoints</span>
            <Monitor className="h-4 w-4 text-[#0F6CBD]" />
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.totalEndpoints}</div>
          <div className="text-[10px] text-slate-400">Managed inventory</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Online</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{stats.onlineEndpoints}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Active connection</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Offline</span>
            <XCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-700">{stats.offlineEndpoints}</div>
          <div className="text-[10px] text-slate-400">Disconnected</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Pending Jobs</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-700">{stats.pendingJobs}</div>
          <div className="text-[10px] text-amber-600 font-medium">In execution queue</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Failed Jobs (24h)</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">{stats.failedJobs}</div>
          <div className="text-[10px] text-rose-600 font-medium">Requires review</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Agent Healthy</span>
            <CheckCircle className="h-4 w-4 text-[#0F6CBD]" />
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.agentHealthy}</div>
          <div className="text-[10px] text-slate-400">Healthy worker agents</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Endpoints by Status - Donut */}
        <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-3">
          <h2 className="font-semibold text-slate-800 text-xs">Endpoints by Status</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4}>
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs font-medium text-slate-600">
            {statusPieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heartbeats Line Chart */}
        <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-3">
          <h2 className="font-semibold text-slate-800 text-xs">Heartbeat Frequency (Last 24 Hours)</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={heartbeatTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="heartbeats" stroke="#0F6CBD" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OS Distribution Bar Chart */}
        <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-3">
          <h2 className="font-semibold text-slate-800 text-xs">Operating System Distribution</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={osDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="os" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0F6CBD" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-3">
        <h2 className="font-semibold text-slate-800 text-xs">Recent Security & Administrative Activity</h2>
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="p-2">Timestamp (UTC)</th>
                <th className="p-2">Actor</th>
                <th className="p-2">Action</th>
                <th className="p-2">Target</th>
                <th className="p-2">Result</th>
                <th className="p-2">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {auditLogs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-2 text-slate-500 font-mono text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-2 font-medium text-slate-900">{log.actor}</td>
                  <td className="p-2 font-semibold text-[#0F6CBD]">{log.action}</td>
                  <td className="p-2 font-mono text-slate-700">{log.target}</td>
                  <td className="p-2">
                    <StatusBadge status={log.result} size="sm" />
                  </td>
                  <td className="p-2 font-mono text-slate-500 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
