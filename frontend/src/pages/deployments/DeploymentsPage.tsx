import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSoftwarePackages, useDeploymentsList } from '../../hooks/useDeployments';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { NewDeploymentWizardModal } from '../../components/modals/NewDeploymentWizardModal';
import { Package, Plus, ChevronRight, RefreshCw, Layers } from 'lucide-react';

export const DeploymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'deployments' | 'packages'>('deployments');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { data: packages = [], isLoading: isPkgsLoading } = useSoftwarePackages();
  const { data: deployments = [], isLoading: isDepsLoading, refetch } = useDeploymentsList();

  const isLoading = isPkgsLoading || isDepsLoading;

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">Software & Agent Deployment Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Deploy software packages, updates, and worker agents in controlled waves</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            aria-label="Refresh deployments list"
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" /> New Deployment Wizard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('deployments')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === 'deployments'
                ? 'border-[#0F6CBD] text-[#0F6CBD] bg-white font-semibold'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Active & Historic Deployments ({deployments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === 'packages'
                ? 'border-[#0F6CBD] text-[#0F6CBD] bg-white font-semibold'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Software Package Repository ({packages.length})</span>
          </button>
        </div>

        <div className="p-4">
          {isLoading && <LoadingSkeleton rows={5} />}

          {!isLoading && activeTab === 'deployments' && (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2.5">Job ID</th>
                    <th className="p-2.5">Package</th>
                    <th className="p-2.5">Target Count</th>
                    <th className="p-2.5">Progress</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Created By</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {deployments.map((job) => {
                    const percent = Math.round((job.successCount / (job.targetCount || 1)) * 100);
                    return (
                      <tr
                        key={job.id}
                        onClick={() => navigate(`/deployments/${job.id}`)}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="p-2.5 font-mono font-semibold text-slate-900">{job.id}</td>
                        <td className="p-2.5 font-medium text-slate-900">
                          {job.packageName} v{job.packageVersion}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">{job.targetCount} machines</td>
                        <td className="p-2.5 w-40">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#0F6CBD] h-full" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="font-mono text-[10px] text-slate-600">{percent}%</span>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <StatusBadge status={job.status} size="sm" />
                        </td>
                        <td className="p-2.5 text-slate-600">{job.createdBy}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/deployments/${job.id}`);
                            }}
                            className="inline-flex items-center gap-1 text-[#0F6CBD] font-medium hover:underline"
                          >
                            Inspect <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && activeTab === 'packages' && (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2.5">Package Name</th>
                    <th className="p-2.5">Version</th>
                    <th className="p-2.5">Publisher</th>
                    <th className="p-2.5">Type & Size</th>
                    <th className="p-2.5">Architecture</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-slate-900">{pkg.name}</td>
                      <td className="p-2.5 font-mono text-slate-800">{pkg.version}</td>
                      <td className="p-2.5 text-slate-700">{pkg.publisher}</td>
                      <td className="p-2.5 font-mono text-slate-600">
                        {pkg.installerType} ({pkg.sizeMb} MB)
                      </td>
                      <td className="p-2.5 font-mono text-slate-500">{pkg.architecture}</td>
                      <td className="p-2.5">
                        <StatusBadge status={pkg.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <NewDeploymentWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </div>
  );
};
