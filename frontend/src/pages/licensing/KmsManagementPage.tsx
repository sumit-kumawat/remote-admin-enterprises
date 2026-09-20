import React, { useState, useEffect } from 'react';
import {
  licensingApi,
  type LicensingOverview,
  type KmsHostItem,
  type ActivationWaveItem,
  type OfflinePackageItem,
  type PerpetualLicenseItem,
  type LicenseEntitlementItem,
  type LicenseAssignmentItem,
  type PerpetualLicenseComplianceOverviewItem,
  type LicenseMatrixRowItem,
} from '../../api/licensingApi';
import { toast } from '../../store/useToastStore';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Server,
  AlertTriangle,
  Activity,
  Layers,
  RefreshCw,
  Plus,
  ShieldCheck,
  HardDriveUpload,
  FileSpreadsheet,
  Grid,
  ArrowRightLeft,
  Trash2,
  Filter,
  PackageCheck,
  FileText,
} from 'lucide-react';

export const KmsManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'perpetual' | 'inventory' | 'entitlements' | 'assignments' | 'matrix' | 'hosts' | 'waves' | 'packages'
  >('perpetual');

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<LicensingOverview | null>(null);
  const [hosts, setHosts] = useState<KmsHostItem[]>([]);
  const [waves, setWaves] = useState<ActivationWaveItem[]>([]);
  const [packages, setPackages] = useState<OfflinePackageItem[]>([]);
  const [licenses, setLicenses] = useState<PerpetualLicenseItem[]>([]);
  const [entitlements, setEntitlements] = useState<LicenseEntitlementItem[]>([]);
  const [assignments, setAssignments] = useState<LicenseAssignmentItem[]>([]);
  const [compliance, setCompliance] = useState<PerpetualLicenseComplianceOverviewItem | null>(null);
  const [matrix, setMatrix] = useState<LicenseMatrixRowItem[]>([]);

  // Inventory Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterActivation, setFilterActivation] = useState('');

  // Modals
  const [isAddHostOpen, setIsAddHostOpen] = useState(false);
  const [newHostName, setNewHostName] = useState('');
  const [newHostFqdn, setNewHostFqdn] = useState('');
  const [newHostIp, setNewHostIp] = useState('');
  const [newHostPort] = useState(1688);
  const [newHostSite] = useState('');
  const [isSavingHost, setIsSavingHost] = useState(false);

  // License Modals
  const [isAddLicenseOpen, setIsAddLicenseOpen] = useState(false);
  const [licenseRef, setLicenseRef] = useState('');
  const [licenseProductFamily, setLicenseProductFamily] = useState<'Windows' | 'Office' | 'WindowsServer' | 'Other'>('Office');
  const [licenseProductName, setLicenseProductName] = useState('Office LTSC 2024 Professional Plus');
  const [licenseProductVersion] = useState('2024');
  const [licenseEdition] = useState('Professional Plus');
  const [licenseTerm, setLicenseTerm] = useState<'Perpetual' | 'Subscription' | 'Unknown'>('Perpetual');
  const [licenseChannel, setLicenseChannel] = useState<'KMS' | 'MAK' | 'ADBA' | 'Retail' | 'OEM' | 'Volume' | 'Unknown'>('Volume');
  const [licenseActivationType, setLicenseActivationType] = useState<'KMS' | 'MAK' | 'ADBA' | 'Retail' | 'OEM' | 'Volume' | 'Unknown'>('KMS');
  const [licenseAgreementRef, setLicenseAgreementRef] = useState('EA-9823411');
  const [licensePurchaseRef] = useState('PO-2026-004');
  const [licenseQuantity, setLicenseQuantity] = useState(500);
  const [licenseSite] = useState('HQ DataCenter');
  const [isSavingLicense, setIsSavingLicense] = useState(false);

  // Confirm Modal for Assign / Release / Transfer / Delete
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'assign' | 'release' | 'transfer' | 'delete' | null;
    payload?: any;
  }>({ isOpen: false, title: '', message: '', actionType: null });

  // Action input states
  const [targetEndpointIdInput, setTargetEndpointIdInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [selectedLicenseForAction, setSelectedLicenseForAction] = useState<PerpetualLicenseItem | null>(null);
  const [selectedAssignmentForAction, setSelectedAssignmentForAction] = useState<LicenseAssignmentItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovData, hostsData, wavesData, pkgsData, licsData, entsData, compData, matData] = await Promise.all([
        licensingApi.getOverview(),
        licensingApi.getKmsHosts(),
        licensingApi.getWaves(),
        licensingApi.getOfflineHistory(),
        licensingApi.getPerpetualLicenses(),
        licensingApi.getEntitlements(),
        licensingApi.getCompliance(),
        licensingApi.getMatrix(),
      ]);

      setOverview(ovData);
      setHosts(hostsData || []);
      setWaves(wavesData || []);
      setPackages(pkgsData || []);
      setLicenses(licsData || []);
      setEntitlements(entsData || []);
      setCompliance(compData || null);
      setMatrix(matData || []);

      if (licsData && licsData.length > 0) {
        const assignData = await licensingApi.getAssignments(licsData[0].id);
        setAssignments(assignData || []);
      }
    } catch (err: any) {
      toast.error('Failed to load Licensing data', err?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostName.trim() || !newHostFqdn.trim()) return;
    setIsSavingHost(true);
    try {
      await licensingApi.createKmsHost({
        name: newHostName.trim(),
        hostname: newHostFqdn.trim(),
        fqdn: newHostFqdn.trim(),
        ipAddress: newHostIp.trim() || undefined,
        port: newHostPort,
        site: newHostSite.trim() || undefined,
      });
      toast.success('KMS Host Registered', `KMS Host '${newHostName}' added successfully.`);
      setIsAddHostOpen(false);
      setNewHostName('');
      setNewHostFqdn('');
      setNewHostIp('');
      loadData();
    } catch (err: any) {
      toast.error('Registration Failed', err?.response?.data?.message || 'Failed to create KMS host');
    } finally {
      setIsSavingHost(false);
    }
  };

  const handleCreateLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseRef.trim() || !licenseProductName.trim()) return;
    setIsSavingLicense(true);
    try {
      await licensingApi.createPerpetualLicense({
        licenseReference: licenseRef.trim(),
        productFamily: licenseProductFamily,
        productName: licenseProductName.trim(),
        productVersion: licenseProductVersion.trim() || undefined,
        edition: licenseEdition.trim() || undefined,
        licenseTerm: licenseTerm,
        licenseChannel: licenseChannel,
        activationType: licenseActivationType,
        agreementReference: licenseAgreementRef.trim() || undefined,
        purchaseReference: licensePurchaseRef.trim() || undefined,
        entitlementQuantity: licenseQuantity,
        site: licenseSite.trim() || undefined,
      });
      toast.success('Perpetual License Registered', `License '${licenseRef}' added with ${licenseQuantity} entitlements.`);
      setIsAddLicenseOpen(false);
      setLicenseRef('');
      loadData();
    } catch (err: any) {
      toast.error('License Creation Failed', err?.response?.data?.message || 'Failed to register license');
    } finally {
      setIsSavingLicense(false);
    }
  };

  const handleConfirmActionExecute = async () => {
    if (!confirmModal.actionType) return;
    try {
      if (confirmModal.actionType === 'assign' && selectedLicenseForAction) {
        if (!targetEndpointIdInput.trim()) {
          toast.error('Endpoint ID Required', 'Please enter a valid Endpoint ID to assign the license.');
          return;
        }
        await licensingApi.assignLicense(selectedLicenseForAction.id, targetEndpointIdInput.trim(), notesInput);
        toast.success('License Assigned', `License ${selectedLicenseForAction.licenseReference} assigned to endpoint.`);
      } else if (confirmModal.actionType === 'release' && selectedAssignmentForAction) {
        await licensingApi.releaseLicense(selectedAssignmentForAction.id, notesInput);
        toast.success('License Released', `Assignment ${selectedAssignmentForAction.id} released.`);
      } else if (confirmModal.actionType === 'transfer' && selectedAssignmentForAction) {
        if (!targetEndpointIdInput.trim()) {
          toast.error('Target Endpoint ID Required', 'Please enter a target Endpoint ID for transfer.');
          return;
        }
        await licensingApi.transferLicense(selectedAssignmentForAction.id, targetEndpointIdInput.trim(), notesInput);
        toast.success('License Transferred', `Assignment transferred to new endpoint successfully.`);
      } else if (confirmModal.actionType === 'delete' && selectedLicenseForAction) {
        await licensingApi.deletePerpetualLicense(selectedLicenseForAction.id);
        toast.success('License Deleted', `Perpetual License ${selectedLicenseForAction.licenseReference} deleted.`);
      }
      setConfirmModal({ isOpen: false, title: '', message: '', actionType: null });
      setNotesInput('');
      setTargetEndpointIdInput('');
      loadData();
    } catch (err: any) {
      toast.error('Operation Failed', err?.response?.data?.message || err?.message || 'Error executing license action');
    }
  };

  const filteredLicenses = licenses.filter((l) => {
    if (filterSearch && !l.productName.toLowerCase().includes(filterSearch.toLowerCase()) && !l.licenseReference.toLowerCase().includes(filterSearch.toLowerCase()))
      return false;
    if (filterProduct && l.productName !== filterProduct) return false;
    if (filterTerm && l.licenseTerm !== filterTerm) return false;
    if (filterChannel && l.licenseChannel !== filterChannel) return false;
    if (filterActivation && l.activationType !== filterActivation) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#2F3EA0]" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Licensing & Volume Activation</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete Perpetual Licensing Management distinguishing License Term (Perpetual/Subscription), Channel (Volume/MAK/ADBA/Retail/OEM), and Activation Type (KMS/MAK/ADBA).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => licensingApi.downloadPerpetualReportCsv()}
            className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" /> Export CSV Report
          </button>
          <button
            onClick={() => loadData()}
            className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#2F3EA0] ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsAddLicenseOpen(true)}
            className="px-3.5 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold hover:bg-[#253285] shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Perpetual License
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 text-xs font-semibold gap-1">
        {[
          { id: 'perpetual', label: `Perpetual Licenses (${licenses.length})`, icon: ShieldCheck },
          { id: 'inventory', label: 'License Inventory', icon: PackageCheck },
          { id: 'entitlements', label: `Entitlements (${entitlements.length})`, icon: FileText },
          { id: 'assignments', label: 'Assignments Workflow', icon: ArrowRightLeft },
          { id: 'matrix', label: 'License Matrix', icon: Grid },
          { id: 'hosts', label: `KMS Hosts (${hosts.length})`, icon: Server },
          { id: 'waves', label: `Activation Waves (${waves.length})`, icon: Layers },
          { id: 'packages', label: `Air-Gapped Packages (${packages.length})`, icon: HardDriveUpload },
          { id: 'overview', label: 'Dashboard Overview', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#2F3EA0] text-[#2F3EA0] bg-white font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && <LoadingSkeleton rows={6} />}

      {!loading && (
        <>
          {/* PERPETUAL LICENSES DASHBOARD TAB */}
          {activeTab === 'perpetual' && (
            <div className="space-y-6">
              {/* Dashboard Cards (Req 44) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Entitlements</div>
                  <div className="text-xl font-extrabold text-slate-900">{compliance?.totalEntitlements || 0}</div>
                  <div className="text-[10px] text-slate-400">Authorized seats</div>
                </div>

                <div className="p-3.5 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase text-blue-600">Assigned</div>
                  <div className="text-xl font-extrabold text-blue-700">{compliance?.assigned || 0}</div>
                  <div className="text-[10px] text-slate-400">Allocated endpoints</div>
                </div>

                <div className="p-3.5 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase text-emerald-600">Available</div>
                  <div className="text-xl font-extrabold text-emerald-700">{compliance?.available || 0}</div>
                  <div className="text-[10px] text-slate-400">Ready for assignment</div>
                </div>

                <div className="p-3.5 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase text-amber-600">Reserved</div>
                  <div className="text-xl font-extrabold text-amber-700">{compliance?.reserved || 0}</div>
                  <div className="text-[10px] text-slate-400">Staged allocation</div>
                </div>

                <div className="p-3.5 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase text-indigo-600">Unassigned</div>
                  <div className="text-xl font-extrabold text-indigo-700">{compliance?.unassigned || 0}</div>
                  <div className="text-[10px] text-slate-400">Pool capacity</div>
                </div>

                <div className="p-3.5 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase text-rose-600">Compliance Alerts</div>
                  <div className="text-xl font-extrabold text-rose-700">{compliance?.complianceExceptions || 0}</div>
                  <div className="text-[10px] text-rose-500">Over-assigned alerts</div>
                </div>
              </div>

              {/* Compliance Warning Notification */}
              {compliance && compliance.alerts && compliance.alerts.length > 0 && (
                <div className="p-4 border border-amber-300 rounded-lg bg-amber-50 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Administrative Compliance Alert</span>
                  </div>
                  {compliance.alerts.map((alt) => (
                    <div key={alt.id} className="text-slate-800">
                      {alt.message} (Detected: {alt.detectedCount}, Assigned: {alt.assignedCount}, Entitlements: {alt.entitlementCount})
                    </div>
                  ))}
                  <div className="text-[11px] text-amber-800 font-semibold italic">
                    Note: Endpoint installations exceeding entitlements trigger administrative alerts without automatically deactivating endpoints.
                  </div>
                </div>
              )}

              {/* Licenses Table (Req 44) */}
              <div className="border rounded-lg bg-white overflow-hidden shadow-xs space-y-3 p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#2F3EA0]" /> Enterprise Perpetual Licenses
                  </h3>
                  <button
                    onClick={() => setIsAddLicenseOpen(true)}
                    className="px-3 py-1 bg-[#2F3EA0] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add License Entitlement
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b font-bold text-slate-700">
                      <tr>
                        <th className="p-2.5">Reference</th>
                        <th className="p-2.5">Product & Edition</th>
                        <th className="p-2.5">Term</th>
                        <th className="p-2.5">Channel</th>
                        <th className="p-2.5">Activation</th>
                        <th className="p-2.5">Purchased</th>
                        <th className="p-2.5">Assigned</th>
                        <th className="p-2.5">Available</th>
                        <th className="p-2.5">Agreement</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-800">
                      {licenses.map((lic) => (
                        <tr key={lic.id} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-bold font-mono text-[#2F3EA0]">{lic.licenseReference}</td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{lic.productName}</div>
                            <div className="text-[11px] text-slate-500">{lic.edition || 'Volume Standard'} ({lic.productFamily})</div>
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {lic.licenseTerm}
                            </span>
                          </td>
                          <td className="p-2.5 font-semibold text-slate-700">{lic.licenseChannel}</td>
                          <td className="p-2.5 font-semibold text-indigo-700">{lic.activationType}</td>
                          <td className="p-2.5 font-bold">{lic.entitlementQuantity}</td>
                          <td className="p-2.5 font-bold text-blue-700">{lic.assignedQuantity}</td>
                          <td className="p-2.5 font-bold text-emerald-700">{lic.availableQuantity}</td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600">{lic.agreementReference || '—'}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                lic.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {lic.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right space-x-1">
                            <button
                              onClick={() => {
                                setSelectedLicenseForAction(lic);
                                setConfirmModal({
                                  isOpen: true,
                                  title: `Assign License (${lic.licenseReference})`,
                                  message: `Explicit Confirmation Required: Are you sure you want to assign 1 perpetual entitlement of '${lic.productName}' to an endpoint?`,
                                  actionType: 'assign',
                                });
                              }}
                              className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded text-[11px] font-semibold hover:bg-blue-100 cursor-pointer"
                            >
                              Assign
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLicenseForAction(lic);
                                setConfirmModal({
                                  isOpen: true,
                                  title: `Delete License (${lic.licenseReference})`,
                                  message: `Explicit Confirmation Required: Are you sure you want to delete perpetual license reference '${lic.licenseReference}'? This cannot be undone.`,
                                  actionType: 'delete',
                                });
                              }}
                              className="px-1.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[11px] hover:bg-rose-100 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {licenses.length === 0 && (
                        <tr>
                          <td colSpan={11} className="p-6 text-center text-slate-500">
                            No perpetual licenses registered. Click 'Add Perpetual License' to record entitlements.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LICENSE INVENTORY TAB (Req 45) */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* Unified License Inventory Filters */}
              <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                  <Filter className="h-4 w-4 text-[#2F3EA0]" /> Unified License Inventory Filters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Search Ref / Name</label>
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      placeholder="Filter reference or product..."
                      className="w-full p-2 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">License Term</label>
                    <select
                      value={filterTerm}
                      onChange={(e) => setFilterTerm(e.target.value)}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="">All Terms</option>
                      <option value="Perpetual">Perpetual</option>
                      <option value="Subscription">Subscription</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">License Channel</label>
                    <select
                      value={filterChannel}
                      onChange={(e) => setFilterChannel(e.target.value)}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="">All Channels</option>
                      <option value="Volume">Volume</option>
                      <option value="KMS">KMS</option>
                      <option value="MAK">MAK</option>
                      <option value="ADBA">ADBA</option>
                      <option value="Retail">Retail</option>
                      <option value="OEM">OEM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Activation Type</label>
                    <select
                      value={filterActivation}
                      onChange={(e) => setFilterActivation(e.target.value)}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="">All Activation Types</option>
                      <option value="KMS">KMS</option>
                      <option value="MAK">MAK</option>
                      <option value="ADBA">ADBA</option>
                      <option value="Retail">Retail</option>
                      <option value="OEM">OEM</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setFilterSearch('');
                        setFilterProduct('');
                        setFilterTerm('');
                        setFilterChannel('');
                        setFilterActivation('');
                      }}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Family</th>
                      <th className="p-3">Term</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Activation</th>
                      <th className="p-3">Entitlement</th>
                      <th className="p-3">Assigned</th>
                      <th className="p-3">Available</th>
                      <th className="p-3">Agreement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800">
                    {filteredLicenses.map((lic) => (
                      <tr key={lic.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{lic.productName} ({lic.edition || 'Std'})</td>
                        <td className="p-3">{lic.productFamily}</td>
                        <td className="p-3 font-bold text-emerald-700">{lic.licenseTerm}</td>
                        <td className="p-3 font-semibold">{lic.licenseChannel}</td>
                        <td className="p-3 font-semibold text-indigo-700">{lic.activationType}</td>
                        <td className="p-3 font-bold">{lic.entitlementQuantity}</td>
                        <td className="p-3 font-bold text-blue-700">{lic.assignedQuantity}</td>
                        <td className="p-3 font-bold text-emerald-700">{lic.availableQuantity}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{lic.agreementReference || '—'}</td>
                      </tr>
                    ))}
                    {filteredLicenses.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-500">
                          No matching inventory records found for applied filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ENTITLEMENTS TAB (Req 41) */}
          {activeTab === 'entitlements' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 border rounded">
                <span className="font-bold text-slate-900 text-xs">Registered License Entitlements</span>
                <button
                  onClick={() => setIsAddLicenseOpen(true)}
                  className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Entitlement
                </button>
              </div>

              <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Entitlement Type</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Assigned</th>
                      <th className="p-3">Available</th>
                      <th className="p-3">Agreement</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800">
                    {entitlements.map((e) => (
                      <tr key={e.id}>
                        <td className="p-3 font-bold text-slate-900">{e.productName}</td>
                        <td className="p-3 font-semibold text-emerald-700">{e.entitlementType}</td>
                        <td className="p-3 font-bold">{e.quantity}</td>
                        <td className="p-3 font-bold text-blue-700">{e.assignedQuantity}</td>
                        <td className="p-3 font-bold text-emerald-700">{e.availableQuantity}</td>
                        <td className="p-3 font-mono text-slate-600">{e.agreementReference || '—'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {entitlements.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          No entitlements recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ASSIGNMENTS WORKFLOW TAB (Req 43, 46) */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-slate-50 space-y-2 text-xs">
                <div className="font-bold text-slate-900 text-sm">License Assignment & Release Workflow</div>
                <div className="text-slate-600">
                  Enforces <span className="font-mono font-bold">Assigned + Reserved &lt;= EntitlementQuantity</span> using strict database transactions to prevent race conditions.
                </div>
              </div>

              <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-bold text-slate-700">
                    <tr>
                      <th className="p-3">License Reference</th>
                      <th className="p-3">Endpoint Hostname</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Assigned At</th>
                      <th className="p-3">Assigned By</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800">
                    {assignments.map((asgn) => (
                      <tr key={asgn.id}>
                        <td className="p-3 font-bold font-mono text-[#2F3EA0]">{asgn.licenseReference}</td>
                        <td className="p-3 font-bold">{asgn.endpointHostname || asgn.endpointId}</td>
                        <td className="p-3 font-mono text-slate-600">{asgn.endpointIpAddress || '—'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              asgn.assignmentStatus === 'Assigned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : asgn.assignmentStatus === 'Released'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {asgn.assignmentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(asgn.assignedAt).toLocaleString()}</td>
                        <td className="p-3">{asgn.assignedBy || 'Admin'}</td>
                        <td className="p-3 text-right space-x-2">
                          {asgn.assignmentStatus === 'Assigned' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedAssignmentForAction(asgn);
                                  setConfirmModal({
                                    isOpen: true,
                                    title: `Release License Assignment`,
                                    message: `Explicit Confirmation Required: Are you sure you want to release license assignment for endpoint '${asgn.endpointHostname}'?`,
                                    actionType: 'release',
                                  });
                                }}
                                className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[11px] font-semibold hover:bg-amber-100 cursor-pointer"
                              >
                                Release
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAssignmentForAction(asgn);
                                  setConfirmModal({
                                    isOpen: true,
                                    title: `Transfer License Assignment`,
                                    message: `Explicit Confirmation Required: Are you sure you want to transfer license assignment from '${asgn.endpointHostname}' to a new target endpoint?`,
                                    actionType: 'transfer',
                                  });
                                }}
                                className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded text-[11px] font-semibold hover:bg-indigo-100 cursor-pointer"
                              >
                                Transfer
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          No license assignments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LICENSE MATRIX TAB (Req 55) */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-slate-50 text-xs space-y-1">
                <div className="font-bold text-slate-900 text-sm">Enterprise License Compatibility Matrix</div>
                <div className="text-slate-600">
                  Maps Microsoft licensing combinations and operational support capabilities within Remote Admin Enterprises.
                </div>
              </div>

              <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-bold text-slate-700">
                    <tr>
                      <th className="p-3">License Term</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Activation</th>
                      <th className="p-3">Platform Managed</th>
                      <th className="p-3">Operational Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800">
                    {matrix.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-emerald-700">{m.licenseTerm}</td>
                        <td className="p-3 font-semibold">{m.channel}</td>
                        <td className="p-3 font-semibold text-indigo-700">{m.activation}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.managed === 'Yes'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.managed.startsWith('Detect')
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.managed}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 text-[11px]">{m.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KMS HOSTS TAB */}
          {activeTab === 'hosts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 border rounded">
                <span className="font-bold text-slate-900 text-xs">Registered Volume Activation KMS Hosts</span>
                <button
                  onClick={() => setIsAddHostOpen(true)}
                  className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add KMS Server
                </button>
              </div>

              <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">FQDN / Hostname</th>
                      <th className="p-3">Port</th>
                      <th className="p-3">Site / Environment</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Latency</th>
                      <th className="p-3">Last Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800">
                    {hosts.map((h) => (
                      <tr key={h.id}>
                        <td className="p-3 font-bold text-slate-900">{h.name}</td>
                        <td className="p-3 font-mono text-slate-700">{h.hostname}</td>
                        <td className="p-3 font-mono">{h.port}</td>
                        <td className="p-3">{h.site || 'Main'} / {h.environment || 'Production'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.status === 'Online' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{h.responseLatencyMs} ms</td>
                        <td className="p-3 text-slate-500">
                          {h.lastHealthCheck ? new Date(h.lastHealthCheck).toLocaleTimeString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACTIVATION WAVES TAB */}
          {activeTab === 'waves' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 border rounded">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Controlled Activation Waves</span>
                  <span className="text-[11px] text-slate-500">Rate-limited rollout across 500+ endpoints with max concurrency = 10.</span>
                </div>
                <button
                  onClick={() => toast.info('Activation Wave', 'Use Activation Wave service to stage rollouts.')}
                  className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Wave
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {waves.map((w) => (
                  <div key={w.id} className="p-4 border rounded-lg bg-white shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{w.name}</h4>
                        <p className="text-xs text-slate-500">
                          Chunk Size: {w.waveSize} | Created by {w.createdBy || 'Admin'} at {new Date(w.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-800">{w.status}</span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2F3EA0] h-full transition-all"
                        style={{ width: `${w.totalEndpoints > 0 ? (w.activatedCount / w.totalEndpoints) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AIR-GAPPED PACKAGES TAB */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 border rounded">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Cryptographic Air-Gapped Transfer Packages</span>
                  <span className="text-[11px] text-slate-500">
                    Export signed JSON configuration packages from Staging to isolated Production environments.
                  </span>
                </div>
              </div>

              <div className="border rounded-lg bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Package ID</th>
                      <th className="p-3">Source → Target</th>
                      <th className="p-3">SHA-256 Hash</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Records</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800">
                    {packages.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-bold font-mono text-[#2F3EA0]">{p.packageId}</td>
                        <td className="p-3">{p.sourceEnvironment} → {p.targetEnvironment}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-500">{p.packageHash.slice(0, 16)}...</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 font-bold">{p.recordCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OVERVIEW DASHBOARD TAB */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">KMS Host Health</div>
                  <div className="text-2xl font-bold text-slate-900">{overview.kmsHostsHealthy} / {overview.kmsHostsTotal}</div>
                </div>
                <div className="p-4 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">Windows Activated</div>
                  <div className="text-2xl font-bold text-slate-900">{overview.windowsActivated}</div>
                </div>
                <div className="p-4 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">Office LTSC Activated</div>
                  <div className="text-2xl font-bold text-slate-900">{overview.officeActivated}</div>
                </div>
                <div className="p-4 border rounded-lg bg-white shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">License Compliance Rate</div>
                  <div className="text-2xl font-bold text-slate-900">{overview.compliancePercentage}%</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Add Perpetual License (Req 40, 46) */}
      <Modal isOpen={isAddLicenseOpen} onClose={() => setIsAddLicenseOpen(false)} title="Register Perpetual License Entitlement">
        <form onSubmit={handleCreateLicenseSubmit} className="space-y-3 font-sans text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">License Reference *</label>
              <input
                type="text"
                required
                value={licenseRef}
                onChange={(e) => setLicenseRef(e.target.value)}
                placeholder="e.g. LIC-OFF-2024-001"
                className="w-full p-2 border rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Family *</label>
              <select
                value={licenseProductFamily}
                onChange={(e) => setLicenseProductFamily(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="Office">Office</option>
                <option value="Windows">Windows</option>
                <option value="WindowsServer">WindowsServer</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={licenseProductName}
              onChange={(e) => setLicenseProductName(e.target.value)}
              placeholder="e.g. Office LTSC 2024 Professional Plus"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">License Term *</label>
              <select
                value={licenseTerm}
                onChange={(e) => setLicenseTerm(e.target.value as any)}
                className="w-full p-2 border rounded bg-emerald-50 font-bold"
              >
                <option value="Perpetual">Perpetual</option>
                <option value="Subscription">Subscription</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">License Channel *</label>
              <select
                value={licenseChannel}
                onChange={(e) => setLicenseChannel(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="Volume">Volume</option>
                <option value="KMS">KMS</option>
                <option value="MAK">MAK</option>
                <option value="ADBA">ADBA</option>
                <option value="Retail">Retail</option>
                <option value="OEM">OEM</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Activation Type *</label>
              <select
                value={licenseActivationType}
                onChange={(e) => setLicenseActivationType(e.target.value as any)}
                className="w-full p-2 border rounded font-semibold text-indigo-700"
              >
                <option value="KMS">KMS</option>
                <option value="MAK">MAK</option>
                <option value="ADBA">ADBA</option>
                <option value="Retail">Retail</option>
                <option value="OEM">OEM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Agreement Reference</label>
              <input
                type="text"
                value={licenseAgreementRef}
                onChange={(e) => setLicenseAgreementRef(e.target.value)}
                placeholder="EA-9823411"
                className="w-full p-2 border rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Entitlement Quantity *</label>
              <input
                type="number"
                min={1}
                required
                value={licenseQuantity}
                onChange={(e) => setLicenseQuantity(parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsAddLicenseOpen(false)}
              className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingLicense}
              className="px-3.5 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold cursor-pointer disabled:opacity-50"
            >
              {isSavingLicense ? 'Saving...' : 'Save Perpetual License'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Explicit Confirmation (Req 46) */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', actionType: null })}
        title={confirmModal.title}
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="p-3 border border-amber-300 bg-amber-50 rounded text-amber-900 font-medium">
            {confirmModal.message}
          </div>

          {(confirmModal.actionType === 'assign' || confirmModal.actionType === 'transfer') && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Endpoint ID *</label>
              <input
                type="text"
                required
                value={targetEndpointIdInput}
                onChange={(e) => setTargetEndpointIdInput(e.target.value)}
                placeholder="e.g. 00000000-0000-0000-0000-000000000001"
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Administrative Action Notes</label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Approved by IT Operations Manager"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', actionType: null })}
              className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmActionExecute}
              className="px-4 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold hover:bg-[#253285] cursor-pointer"
            >
              Confirm & Execute
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add KMS Host */}
      <Modal isOpen={isAddHostOpen} onClose={() => setIsAddHostOpen(false)} title="Register Enterprise KMS Host">
        <form onSubmit={handleCreateHostSubmit} className="space-y-3 font-sans text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Friendly Name *</label>
            <input
              type="text"
              required
              value={newHostName}
              onChange={(e) => setNewHostName(e.target.value)}
              placeholder="e.g. KMS-PRIMARY-01"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hostname / FQDN *</label>
            <input
              type="text"
              required
              value={newHostFqdn}
              onChange={(e) => setNewHostFqdn(e.target.value)}
              placeholder="e.g. kms1.domain.local"
              className="w-full p-2 border rounded font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsAddHostOpen(false)}
              className="px-3 py-1.5 bg-slate-100 border rounded font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingHost}
              className="px-3 py-1.5 bg-[#2F3EA0] text-white rounded font-semibold cursor-pointer disabled:opacity-50"
            >
              {isSavingHost ? 'Registering...' : 'Register KMS Host'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
