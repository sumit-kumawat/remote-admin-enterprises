import React, { useState } from 'react';
import { useSoftwarePackages, useUploadPackage, useDeletePackage } from '../../hooks/usePackages';
import { useDeploymentJobs } from '../../hooks/useDeployments';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { NewDeploymentWizardModal } from '../../components/modals/NewDeploymentWizardModal';
import { Package, Plus, RefreshCw, Layers, Upload, Trash2 } from 'lucide-react';

export const DeploymentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deployments' | 'packages'>('deployments');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { data: packages = [], isLoading: isPkgsLoading } = useSoftwarePackages();
  const { data: deployments = [], isLoading: isDepsLoading, refetch } = useDeploymentJobs();
  const uploadMutation = useUploadPackage();
  const deletePackageMutation = useDeletePackage();

  const [pkgName, setPkgName] = useState('');
  const [pkgVersion, setPkgVersion] = useState('');
  const [pkgArch] = useState('x64');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isLoading = isPkgsLoading || isDepsLoading;

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', pkgName);
    formData.append('version', pkgVersion);
    formData.append('architecture', pkgArch);

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        setPkgName('');
        setPkgVersion('');
        setSelectedFile(null);
      },
    });
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">Software & Agent Deployment Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Deploy MSI/EXE software packages and worker agents in controlled waves</p>
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

        <div className="p-4 space-y-4">
          {isLoading && <LoadingSkeleton rows={5} />}

          {!isLoading && activeTab === 'deployments' && (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2.5">Endpoint Hostname</th>
                    <th className="p-2.5">Package</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Execution Log</th>
                    <th className="p-2.5 text-right">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {deployments.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{job.endpoint?.hostname || job.endpointId}</td>
                      <td className="p-2.5 font-medium text-[#0F6CBD]">
                        {job.packageName} v{job.packageVersion}
                      </td>
                      <td className="p-2.5">
                        <StatusBadge status={job.status} size="sm" />
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                        {job.stdout || 'Execution complete.'}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-500">
                        {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && activeTab === 'packages' && (
            <div className="space-y-4">
              {/* Installer Upload Form */}
              <div className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-3">
                <h2 className="font-semibold text-slate-900 text-xs border-b pb-2">Upload New Installer Package (.msi / .exe)</h2>
                <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Package Name</label>
                    <input
                      type="text"
                      value={pkgName}
                      onChange={(e) => setPkgName(e.target.value)}
                      placeholder="e.g. 7-Zip Enterprise"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Version</label>
                    <input
                      type="text"
                      value={pkgVersion}
                      onChange={(e) => setPkgVersion(e.target.value)}
                      placeholder="e.g. 23.01"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Installer File (.msi / .exe)</label>
                    <input
                      type="file"
                      accept=".msi,.exe"
                      onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                      className="w-full text-xs text-slate-700"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!selectedFile || uploadMutation.isPending}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload Package
                    </button>
                  </div>
                </form>
              </div>

              {/* Package Table */}
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5">Package Name</th>
                      <th className="p-2.5">Version</th>
                      <th className="p-2.5">File Name</th>
                      <th className="p-2.5">Size</th>
                      <th className="p-2.5">Uploaded</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{pkg.name}</td>
                        <td className="p-2.5 font-mono text-slate-800">{pkg.version}</td>
                        <td className="p-2.5 font-mono text-slate-600">{pkg.fileName}</td>
                        <td className="p-2.5 font-mono text-slate-500">{(pkg.fileSize / (1024 * 1024)).toFixed(2)} MB</td>
                        <td className="p-2.5 text-slate-500">{new Date(pkg.uploadedAt).toLocaleDateString()}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => deletePackageMutation.mutate(pkg.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewDeploymentWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </div>
  );
};
