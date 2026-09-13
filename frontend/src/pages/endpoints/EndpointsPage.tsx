import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEndpointsList, useBulkAction, useCreateLocalAdmin } from '../../hooks/useEndpoints';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { AddEndpointModal } from '../../components/modals/AddEndpointModal';
import { ImportEndpointsModal } from '../../components/modals/ImportEndpointsModal';
import { DeviceIcon } from '../../components/common/DeviceIcon';
import { toast } from '../../store/useToastStore';
import {
  Search,
  Plus,
  RefreshCw,
  Filter,
  FileUp,
  CheckSquare,
  Square,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const EndpointsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [authFilter, setAuthFilter] = useState<string>('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useEndpointsList({ search, page: 1, pageSize: 100 });
  const bulkActionMutation = useBulkAction();
  const createLocalAdminMutation = useCreateLocalAdmin();

  const rawItems = data?.items || [];

  const filteredItems = rawItems.filter((item) => {
    if (statusFilter !== 'All' && item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (authFilter !== 'All' && (item.authStatus || 'Authorized').toLowerCase() !== authFilter.toLowerCase()) return false;
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

  const handleCopyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(`${label}-${text}`);
    toast.success('Copied to Clipboard', `${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">Endpoint Management Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central inventory of managed Windows endpoints, connectivity, and authentication credentials
          </p>
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
              placeholder="Filter by hostname, FQDN, IP, or credential user..."
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
              <option value="CheckConnection">Check Connection & Auth</option>
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
          </select>

          <select
            value={authFilter}
            onChange={(e) => setAuthFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
          >
            <option value="All">Authorization: All</option>
            <option value="Authorized">Authorized</option>
            <option value="NotAuthorized">Not Authorized</option>
            <option value="Checking">Checking</option>
            <option value="AuthenticationFailed">Auth Failed</option>
            <option value="Timeout">Timeout</option>
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
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-[#2F3EA0]" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-2.5">Hostname</th>
                  <th className="p-2.5">IP Address</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Authorization</th>
                  <th className="p-2.5">Login User</th>
                  <th className="p-2.5">Operating System</th>
                  <th className="p-2.5 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredItems.map((ep) => {
                  const isSelected = selectedEndpointIds.includes(ep.id);
                  const authStatus = ep.authStatus || 'NotAuthorized';
                  const authUser = ep.authUser || 'No credential configured';
                  const deviceType = ep.deviceType || 'Windows';

                  return (
                    <tr
                      key={ep.id}
                      onClick={() => navigate(`/endpoints/${ep.id}`)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center" onClick={(e) => toggleSelectEndpoint(ep.id, e)}>
                        <button className="text-slate-500 hover:text-slate-900">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#2F3EA0]" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Hostname Column */}
                      <td className="p-2.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <DeviceIcon deviceType={deviceType} size={15} />
                          <span className="hover:underline hover:text-[#2F3EA0]">{ep.hostname}</span>
                          <button
                            onClick={(e) => handleCopyToClipboard(ep.hostname, 'Hostname', e)}
                            title="Copy Hostname"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            {copiedField === `Hostname-${ep.hostname}` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        {ep.fqdn && (
                          <div className="text-[10px] text-slate-400 font-mono font-normal pl-5">
                            {ep.fqdn}
                          </div>
                        )}
                      </td>

                      {/* IP Address Column */}
                      <td className="p-2.5 font-mono text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span>{ep.ipAddress || '—'}</span>
                          {ep.ipAddress && (
                            <button
                              onClick={(e) => handleCopyToClipboard(ep.ipAddress!, 'IP Address', e)}
                              title="Copy IP Address"
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            >
                              {copiedField === `IP Address-${ep.ipAddress}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="p-2.5">
                        <StatusBadge status={ep.status} size="sm" />
                      </td>

                      {/* Login / Authorization Column */}
                      <td className="p-2.5">
                        {authStatus === 'Authorized' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="h-3 w-3" /> Authorized
                          </span>
                        )}
                        {authStatus === 'Pending Authorization' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            <Clock className="h-3 w-3" /> Pending Auth
                          </span>
                        )}
                        {authStatus === 'NotAuthorized' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="h-3 w-3" /> Not Authorized
                          </span>
                        )}
                        {authStatus === 'Checking' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3 animate-spin" /> Checking
                          </span>
                        )}
                        {authStatus === 'AuthenticationFailed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="h-3 w-3" /> Auth Failed
                          </span>
                        )}
                        {(authStatus === 'Timeout' || authStatus === 'Unreachable') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            <Clock className="h-3 w-3" /> Unreachable
                          </span>
                        )}
                      </td>

                      {/* Login User Column */}
                      <td className="p-2.5 font-mono text-slate-800 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {authUser}
                        </span>
                      </td>

                      {/* OS / Device Column */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <DeviceIcon deviceType={deviceType} size={14} />
                          <span>{deviceType === 'Windows' ? 'Windows Server / 11' : deviceType}</span>
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/endpoints/${ep.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded transition-colors shadow-xs"
                        >
                          <span>Manage Endpoint</span> <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex justify-between items-center">
            <span>
              Showing {filteredItems.length} of {rawItems.length} registered endpoints ({selectedEndpointIds.length} selected)
            </span>
            <span>Refreshes automatically every 15s</span>
          </div>
        </div>
      )}

      <AddEndpointModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <ImportEndpointsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  );
};
