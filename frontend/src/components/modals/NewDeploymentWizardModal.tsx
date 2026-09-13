import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useSoftwarePackages } from '../../hooks/usePackages';
import { uploadSoftwarePackage } from '../../api/packagesApi';
import { useCreateDeployment } from '../../hooks/useDeployments';
import { useEndpointsList } from '../../hooks/useEndpoints';
import { StatusBadge } from '../common/StatusBadge';
import { Package, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

interface NewDeploymentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDeploymentWizardModal: React.FC<NewDeploymentWizardModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>([]);
  const [waveSize, setWaveSize] = useState<number>(25);
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(60);
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [endpointSearch, setEndpointSearch] = useState('');

  const { data: packages = [] } = useSoftwarePackages();
  const { data: endpointsData } = useEndpointsList({ search: endpointSearch, pageSize: 100 });
  const createDeploymentMutation = useCreateDeployment();

  const endpoints = endpointsData?.items || [];

  const handleToggleEndpoint = (id: string) => {
    setSelectedEndpointIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEndpoints = () => {
    if (selectedEndpointIds.length === endpoints.length) {
      setSelectedEndpointIds([]);
    } else {
      setSelectedEndpointIds(endpoints.map((e) => e.id));
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPackageId('');
    setSelectedEndpointIds([]);
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedPackageId || selectedEndpointIds.length === 0) return;

    createDeploymentMutation.mutate(
      {
        packageId: selectedPackageId,
        endpointIds: selectedEndpointIds,
        waveSize,
        timeoutSeconds: timeoutMinutes * 60,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Software Deployment Wizard" subtitle="Configure wave-based deployment to endpoints" maxWidth="2xl">
      <div className="space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? 'text-[#2F3EA0]' : 'text-slate-400'}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-[#2F3EA0] text-white' : 'bg-slate-200 text-slate-600'}`}>1</div>
            <span>Select Package</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? 'text-[#2F3EA0]' : 'text-slate-400'}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-[#2F3EA0] text-white' : 'bg-slate-200 text-slate-600'}`}>2</div>
            <span>Select Endpoints ({selectedEndpointIds.length})</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 3 ? 'text-[#2F3EA0]' : 'text-slate-400'}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-[#2F3EA0] text-white' : 'bg-slate-200 text-slate-600'}`}>3</div>
            <span>Schedule & Wave</span>
          </div>
        </div>

        {/* Step 1: Select Package */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800">Select Software Package to Deploy</label>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded transition-colors shadow-xs">
                <span>Upload Local Package (.msi / .exe)</span>
                <input
                  type="file"
                  accept=".msi,.exe"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
                      formData.append('version', '1.0.0');
                      formData.append('architecture', 'x64');
                      try {
                        const newPkg = await uploadSoftwarePackage(formData);
                        if (newPkg?.id) {
                          setSelectedPackageId(newPkg.id);
                        }
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Failed to upload package file');
                      }
                    }
                  }}
                />
              </label>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`p-3 border rounded-md cursor-pointer transition-all flex items-center justify-between text-xs ${
                    selectedPackageId === pkg.id
                      ? 'border-[#2F3EA0] bg-blue-50/50 ring-1 ring-[#2F3EA0]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-[#2F3EA0]" />
                    <div>
                      <div className="font-semibold text-slate-900">{pkg.name} v{pkg.version}</div>
                      <div className="text-slate-500 text-[11px]">
                        {pkg.fileName} • ({(pkg.fileSize / (1024 * 1024)).toFixed(1)} MB) • {pkg.architecture}
                      </div>
                    </div>
                  </div>
                  {selectedPackageId === pkg.id && <CheckCircle2 className="h-5 w-5 text-[#2F3EA0]" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Endpoints */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">Select Target Endpoints ({selectedEndpointIds.length} selected)</label>
              <input
                type="text"
                value={endpointSearch}
                onChange={(e) => setEndpointSearch(e.target.value)}
                placeholder="Search hostname or IP..."
                className="px-2.5 py-1 text-xs border border-slate-300 rounded w-48 focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
              />
            </div>

            <div className="border border-slate-200 rounded max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={endpoints.length > 0 && selectedEndpointIds.length === endpoints.length}
                        onChange={handleSelectAllEndpoints}
                        className="rounded text-[#2F3EA0]"
                      />
                    </th>
                    <th className="p-2">Hostname</th>
                    <th className="p-2">IP Address</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {endpoints.map((ep) => (
                    <tr
                      key={ep.id}
                      onClick={() => handleToggleEndpoint(ep.id)}
                      className={`cursor-pointer hover:bg-slate-50 ${selectedEndpointIds.includes(ep.id) ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedEndpointIds.includes(ep.id)}
                          onChange={() => handleToggleEndpoint(ep.id)}
                          className="rounded text-[#2F3EA0]"
                        />
                      </td>
                      <td className="p-2 font-medium text-slate-900">{ep.hostname}</td>
                      <td className="p-2 font-mono text-slate-600">{ep.ipAddress || '—'}</td>
                      <td className="p-2">
                        <StatusBadge status={ep.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                  {endpoints.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">No endpoints found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Schedule & Wave Config */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
              <div className="font-semibold text-slate-900">Deployment Summary:</div>
              <div className="text-slate-700">
                Package: <span className="font-medium text-[#2F3EA0]">{selectedPackage?.name} v{selectedPackage?.version}</span>
              </div>
              <div className="text-slate-700">
                Target Endpoints: <span className="font-medium">{selectedEndpointIds.length} machines</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Wave Size (Batch Count)</label>
                <input
                  type="number"
                  value={waveSize}
                  onChange={(e) => setWaveSize(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                />
                <span className="text-[10px] text-slate-500">Endpoints per wave</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Timeout (Minutes)</label>
                <input
                  type="number"
                  value={timeoutMinutes}
                  onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                  min={5}
                  max={480}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                />
                <span className="text-[10px] text-slate-500">Execution timeout</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Retries</label>
                <input
                  type="number"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  min={0}
                  max={5}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
                />
                <span className="text-[10px] text-slate-500">Retries on error</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={step === 1 ? handleClose : () => setStep((step - 1) as 1 | 2)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            {step === 1 ? 'Cancel' : <><ChevronLeft className="h-3.5 w-3.5" /> Back</>}
          </button>

          {step < 3 ? (
            <button
              type="button"
              disabled={(step === 1 && !selectedPackageId) || (step === 2 && selectedEndpointIds.length === 0)}
              onClick={() => setStep((step + 1) as 2 | 3)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#2F3EA0] hover:bg-[#263385] rounded transition-colors disabled:opacity-50"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createDeploymentMutation.isPending}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#2F3EA0] hover:bg-[#263385] rounded transition-colors disabled:opacity-50"
            >
              {createDeploymentMutation.isPending ? 'Queuing Deployment...' : 'Queue Deployment'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
