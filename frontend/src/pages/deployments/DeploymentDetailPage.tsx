import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeploymentJobs } from '../../hooks/useDeployments';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ArrowLeft, CheckCircle2, Layers } from 'lucide-react';

export const DeploymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: deployments = [], isLoading, isError, refetch } = useDeploymentJobs();
  const job = deployments.find((d) => d.id === id);

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError || !job) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/deployments')}
            className="inline-flex items-center gap-1 text-[#2F3EA0] hover:underline font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Deployments
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-[#2F3EA0]/10 text-[#2F3EA0] rounded-md">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold text-slate-900">
                {job.packageName} v{job.packageVersion}
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Job ID: {job.id} • Target Endpoint: {job.endpoint?.hostname || job.endpointId}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="text-slate-500 font-semibold text-[11px]">Target Endpoint</div>
          <div className="text-base font-bold text-slate-900">{job.endpoint?.hostname || job.endpointId}</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px]">Execution Status</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-emerald-700">{job.status}</div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-xs space-y-1">
          <div className="text-slate-500 font-semibold text-[11px]">Exit Code</div>
          <div className="text-base font-mono font-bold text-slate-800">{job.exitCode ?? 0}</div>
        </div>
      </div>

      {/* Output Console Log Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-2">
        <div className="font-semibold text-slate-800 text-xs">Standard Output Log:</div>
        <pre className="p-3 bg-slate-900 text-emerald-400 rounded-md font-mono text-[11px] overflow-x-auto leading-tight">
          {job.stdout || 'No stdout generated'}
        </pre>
      </div>
    </div>
  );
};
