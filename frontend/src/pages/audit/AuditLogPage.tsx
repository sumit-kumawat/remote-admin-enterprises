import React, { useState } from 'react';
import { useAuditLogs } from '../../hooks/useAudit';
import type { AuditLogItem } from '../../api/auditApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { AuditDetailDrawer } from '../../components/drawers/AuditDetailDrawer';
import { Filter, RefreshCw, ChevronRight } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [actorFilter, setActorFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');
  const [selectedAudit, setSelectedAudit] = useState<AuditLogItem | null>(null);

  const { data: auditLogs = [], isLoading, refetch } = useAuditLogs({
    actor: actorFilter,
    action: actionFilter,
    result: resultFilter,
  });

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">Security & Audit Event Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Immutable audit record of all authentication, administrative actions, and endpoint operations</p>
        </div>
        <button
          onClick={() => refetch()}
          aria-label="Refresh audit logs"
          className="p-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700 text-xs">Filter Ledger:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Actor User</label>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            >
              <option value="All">All Actors</option>
              <option value="admin">admin</option>
              <option value="operator1">operator1</option>
              <option value="auditor1">auditor1</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            >
              <option value="All">All Actions</option>
              <option value="Login">Login</option>
              <option value="ChangePassword">ChangePassword</option>
              <option value="CreateUser">CreateUser</option>
              <option value="DeleteUser">DeleteUser</option>
              <option value="CreateEndpoint">CreateEndpoint</option>
              <option value="ImportEndpoints">ImportEndpoints</option>
              <option value="DeploySoftware">DeploySoftware</option>
              <option value="DiscoveryScan">DiscoveryScan</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Result</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            >
              <option value="All">All Results</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="PreconditionRequired">PreconditionRequired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-2.5">Timestamp (UTC)</th>
                  <th className="p-2.5">Actor</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Target</th>
                  <th className="p-2.5">Result</th>
                  <th className="p-2.5">IP Address</th>
                  <th className="p-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedAudit(log)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toUTCString()}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-900">{log.actor}</td>
                    <td className="p-2.5 font-semibold text-[#2F3EA0]">{log.action}</td>
                    <td className="p-2.5 font-mono text-slate-700">{log.target}</td>
                    <td className="p-2.5">
                      <StatusBadge status={log.result} size="sm" />
                    </td>
                    <td className="p-2.5 font-mono text-slate-500 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedAudit(log)}
                        className="inline-flex items-center gap-1 text-[#2F3EA0] font-medium hover:underline text-[11px]"
                      >
                        Inspect Payload <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AuditDetailDrawer
        auditEntry={selectedAudit}
        isOpen={Boolean(selectedAudit)}
        onClose={() => setSelectedAudit(null)}
      />
    </div>
  );
};
