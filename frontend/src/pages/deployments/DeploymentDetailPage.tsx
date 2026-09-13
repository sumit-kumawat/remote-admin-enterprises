import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeploymentDetail, useRetryFailedDeployment } from '../../hooks/useDeployments';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, Clock, Layers } from 'lucide-react';

export const DeploymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useDeploymentDetail(id || '');
  const retryMutation = useRetryFailedDeployment();

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const { deployment, endpoints } = data;
  const percent = Math.round((deployment.successCount / (deployment.targetCount || 1)) * 100);

  const handleRetryFailed = () => {
    retryMutation.mutate(deployment.id);
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/deployments')}
            className="inline-flex items-center gap-1 text-[#0F6CBD] hover:underline font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Deployments
          </button>
          <button
            onClick={handleRetryFailed}
            disabled={retryMutation.isPending || deployment.failedCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry Failed Targets ({deployment.failedCount})
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-[#0F6CBD]/10 text-[#0F6CBD] rounded-md">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold text-slate-900">
                {deployment.packageName} v{deployment.packageVersion}
              </h1>
              <StatusBadge status={deployment.status} />
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Job ID: {deployment.id} • Wave Size: {deployment.waveSize} • Timeout: {deployment.timeoutMinutes}m • Max Retries: {deployment.maxRetries}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="text-slate-500 font-semibold text-[11px]">Total Targets</div>
          <div className="text-xl font-bold text-slate-900">{deployment.targetCount}</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Success</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{deployment.successCount}</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Failed</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">{deployment.failedCount}</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Pending / Running</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-700">{deployment.pendingCount + deployment.runningCount}</div>
        </div>
      </div>

      {/* Overall Progress Bar Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-2">
        <div className="flex justify-between items-center font-semibold text-slate-800 text-xs">
          <span>Overall Wave Deployment Completion</span>
          <span>{percent}% Completed</span>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div className="bg-[#0F6CBD] h-full transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Per-Endpoint Status Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
          Per-Endpoint Execution Matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="p-2.5">Hostname</th>
                <th className="p-2.5">IP Address</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Duration</th>
                <th className="p-2.5">Error Message / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {endpoints.map((ep) => (
                <tr key={ep.endpointId} className="hover:bg-slate-50">
                  <td className="p-2.5 font-semibold text-slate-900">{ep.hostname}</td>
                  <td className="p-2.5 font-mono text-slate-700">{ep.ipAddress}</td>
                  <td className="p-2.5">
                    <StatusBadge status={ep.status} size="sm" />
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">
                    {ep.durationSeconds ? `${ep.durationSeconds}s` : '—'}
                  </td>
                  <td className="p-2.5 text-rose-600 font-mono text-[11px]">
                    {ep.errorMessage || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
