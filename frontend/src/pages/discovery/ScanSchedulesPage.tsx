import React, { useState } from 'react';
import { formatCronExpression } from '../../utils/cronFormatter';
import { useSchedules, useCreateSchedule, useDeleteSchedule } from '../../hooks/useDiscovery';
import { useAuthStore } from '../../store/useAuthStore';
import { DiscoverySubnav } from './DiscoverySubnav';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import type { ScanType } from '../../types/discovery';
import { CalendarClock, Plus, Trash2, Clock, CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export const ScanSchedulesPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin';

  const { data: schedules = [], isLoading } = useSchedules();
  const createScheduleMutation = useCreateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('Daily Subnet Audit');
  const [cronExpression, setCronExpression] = useState('0 2 * * *');
  const [targetCidr, setTargetCidr] = useState('192.168.100.0/24');
  const [scanType, setScanType] = useState<ScanType>('Full');
  const [formError, setFormError] = useState<string | null>(null);

  const getHumanCron = (expression: string) => {
    return formatCronExpression(expression);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    createScheduleMutation.mutate(
      {
        name,
        cronExpression,
        targetCidr,
        scanType,
      },
      {
        onSuccess: () => {
          setShowModal(false);
          setName('Daily Subnet Audit');
          setCronExpression('0 2 * * *');
        },
        onError: (err: any) => {
          setFormError(err.response?.data?.message || err.message || 'Failed to create schedule');
        },
      }
    );
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      <DiscoverySubnav />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 border border-slate-200 rounded-md shadow-xs gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[#2F3EA0]" />
            Automated Discovery Scan Scheduler
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Schedule recurring subnet discovery scans using Cron syntax. Automated jobs enrich network inventory automatically.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#2F3EA0] hover:bg-[#233080] rounded shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Create Schedule
          </button>
        ) : (
          <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Schedule management requires Admin role.
          </div>
        )}
      </div>

      {/* Schedules Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <LoadingSkeleton rows={5} />
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <div className="font-semibold text-slate-700">No discovery schedules configured</div>
            <p className="text-[11px] text-slate-400 mt-1">Create an automated cron schedule to run background probes periodically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Schedule Name</th>
                  <th className="p-2.5">Target CIDR</th>
                  <th className="p-2.5">Cron Syntax</th>
                  <th className="p-2.5">Frequency (Human Readable)</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5">Last Run</th>
                  <th className="p-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{sch.name}</td>
                    <td className="p-2.5 font-mono text-slate-800 font-semibold">{sch.targetCidr}</td>
                    <td className="p-2.5 font-mono bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 w-fit">
                      {sch.cronExpression}
                    </td>
                    <td className="p-2.5 text-slate-600 italic font-medium">{getHumanCron(sch.cronExpression)}</td>
                    <td className="p-2.5 text-slate-700 font-semibold">{sch.scanType}</td>
                    <td className="p-2.5 text-center">
                      {sch.enabled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold text-[10px]">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold text-[10px]">
                          <XCircle className="h-3 w-3" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                      {sch.lastRunAt ? new Date(sch.lastRunAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-2.5 text-center">
                      {isAdmin && (
                        <button
                          onClick={() => deleteScheduleMutation.mutate(sch.id)}
                          title="Delete schedule"
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Automated Discovery Schedule">
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Schedule Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nightly Server Subnet Scan"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Target Subnet CIDR</label>
              <input
                type="text"
                value={targetCidr}
                onChange={(e) => setTargetCidr(e.target.value)}
                placeholder="e.g. 192.168.100.0/24"
                className="w-full px-2.5 py-1.5 font-mono border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Cron Schedule Syntax</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="e.g. 0 2 * * * (Every day at 2am)"
                className="w-full px-2.5 py-1.5 font-mono border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
              />
              <span className="text-[11px] text-blue-800 mt-1 block font-semibold">
                Interpretation: {getHumanCron(cronExpression)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Probe Strategy</label>
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value as ScanType)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="Full">Full (ARP + ICMP + TCP)</option>
                <option value="ARP">ARP Only</option>
                <option value="ICMP">ICMP Ping Only</option>
                <option value="TCP">TCP Port Sweep</option>
              </select>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createScheduleMutation.isPending}
                className="px-4 py-1.5 bg-[#2F3EA0] hover:bg-[#233080] text-white font-bold rounded disabled:opacity-50"
              >
                {createScheduleMutation.isPending ? 'Saving Schedule...' : 'Save Schedule'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
