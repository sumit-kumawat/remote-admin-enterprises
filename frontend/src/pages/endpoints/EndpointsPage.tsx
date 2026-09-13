import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEndpointsList, useBulkAction, useCreateLocalAdmin } from '../../hooks/useEndpoints';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApprovalBadge } from '../../components/common/ApprovalBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { AddEndpointModal } from '../../components/modals/AddEndpointModal';
import { ImportEndpointsModal } from '../../components/modals/ImportEndpointsModal';
import { EndpointControlModal } from '../../components/modals/EndpointControlModal';
import { Search, Plus, RefreshCw, Filter, ChevronRight, FileUp, CheckSquare, Square, SlidersHorizontal } from 'lucide-react';

export const EndpointsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [approvalFilter, setApprovalFilter] = useState<string>('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedControlEndpointId, setSelectedControlEndpointId] = useState<string | null>(null);
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>([]);

  const { data, isLoading, isError, refetch } = useEndpointsList({ search, page: 1, pageSize: 100 });
  const bulkActionMutation = useBulkAction();
  const createLocalAdminMutation = useCreateLocalAdmin();

  const rawItems = data?.items || [];

  const filteredItems = rawItems.filter((item) => {
    if (statusFilter !== 'All' && item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (approvalFilter !== 'All' && item.approvalStatus.toLowerCase() !== approvalFilter.toLowerCase()) return false;
    return true;
  });

  const isAllSelected = filteredItems.length > 0 && selectedEndpointIds.length === filteredItems.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEndpointIds([]);
    } else {
      setSelectedEndpointIds(filteredItems.map((item) => item.id));
    }
  };

  const toggleSelectEndpoint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEndpointIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedEndpointIds.length === 0) return;
    if (action === 'CreateLocalAdmin') {
      createLocalAdminMutation.mutate(selectedEndpointIds, {
        onSuccess: () => setSelectedEndpointIds([]),
      });
    } else {
      bulkActionMutation.mutate(
        { action, endpointIds: selectedEndpointIds },
        { onSuccess: () => setSelectedEndpointIds([]) }
      );
    }
  };

  const formatRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">Endpoint Management Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Central inventory of registered Windows 10/11 endpoints and servers</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refetch()}
            aria-label="Refresh endpoints"
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors shadow-xs"
          >
            <FileUp className="h-4 w-4 text-[#2F3EA0]" /> Import File (.txt / .csv)
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Endpoint
          </button>
        </div>
      </div>

      {/* Bulk Action & Filter Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchParams(e.target.value ? { search: e.target.value } : {});
              }}
              placeholder="Filter by hostname, FQDN, or IP address..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>
        </div>

        {/* Selected Counter & Bulk Actions Dropdown */}
        {selectedEndpointIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded text-blue-900 font-semibold animate-in fade-in">
            <span className="text-xs">{selectedEndpointIds.length} Selected</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAction(e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-2 py-0.5 text-xs font-medium border border-blue-300 rounded bg-white text-blue-900 focus:outline-none cursor-pointer"
            >
              <option value="">Bulk Actions...</option>
              <option value="CheckConnection">Check Connection</option>
              <option value="Approve">Approve Endpoints</option>
              <option value="Reject">Reject Endpoints</option>
              <option value="CreateLocalAdmin">Provision Managed Local User ("ra")</option>
              <option value="RestartAgent">Restart Worker Agent</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
          >
            <option value="All">Status: All</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Unknown">Unknown</option>
          </select>

          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
          >
            <option value="All">Approval: All</option>
            <option value="Approved">Approved</option>
            <option value="PendingApproval">Pending Approval</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Endpoints Table */}
      {isLoading && <LoadingSkeleton rows={8} />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && !isError && filteredItems.length === 0 && (
        <EmptyState
          title="No Endpoints Found"
          description="No registered endpoints match your search or filter parameters."
          actionText="Add New Endpoint"
          onAction={() => setIsAddModalOpen(true)}
        />
      )}

      {!isLoading && !isError && filteredItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-2.5 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-900">
                      {isAllSelected ? <CheckSquare className="h-4 w-4 text-[#2F3EA0]" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="p-2.5">Hostname</th>
                  <th className="p-2.5">IP Address</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Approval</th>
                  <th className="p-2.5">Agent Version</th>
                  <th className="p-2.5">Last Heartbeat</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredItems.map((ep) => {
                  const isSelected = selectedEndpointIds.includes(ep.id);
                  return (
                    <tr
                      key={ep.id}
                      onClick={() => setSelectedControlEndpointId(ep.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center" onClick={(e) => toggleSelectEndpoint(ep.id, e)}>
                        <button className="text-slate-500 hover:text-slate-900">
                          {isSelected ? <CheckSquare className="h-4 w-4 text-[#2F3EA0]" /> : <Square className="h-4 w-4 text-slate-300" />}
                        </button>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900">
                        <div>{ep.hostname}</div>
                        {ep.fqdn && <div className="text-[10px] text-slate-400 font-mono font-normal">{ep.fqdn}</div>}
                      </td>
                      <td className="p-2.5 font-mono text-slate-700">{ep.ipAddress || '—'}</td>
                      <td className="p-2.5">
                        <StatusBadge status={ep.status} size="sm" />
                      </td>
                      <td className="p-2.5">
                        <ApprovalBadge status={ep.approvalStatus} />
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">{ep.agentVersion || 'v2.4.1'}</td>
                      <td className="p-2.5 font-mono text-slate-500">{formatRelativeTime(ep.lastHeartbeat)}</td>
                      <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedControlEndpointId(ep.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded transition-colors shadow-xs"
                        >
                          <SlidersHorizontal className="h-3 w-3" /> Control Panel <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex justify-between items-center">
            <span>Showing {filteredItems.length} of {rawItems.length} registered endpoints ({selectedEndpointIds.length} selected)</span>
            <span>Refreshes automatically every 15s</span>
          </div>
        </div>
      )}

      <AddEndpointModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <ImportEndpointsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <EndpointControlModal
        endpointId={selectedControlEndpointId}
        isOpen={Boolean(selectedControlEndpointId)}
        onClose={() => setSelectedControlEndpointId(null)}
      />
    </div>
  );
};
