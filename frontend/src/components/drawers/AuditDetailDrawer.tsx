import React from 'react';
import { X, FileText, Calendar, User, Shield, Server, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { AuditLogItem } from '../../api/auditApi';

interface AuditDetailDrawerProps {
  auditEntry: AuditLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailDrawer: React.FC<AuditDetailDrawerProps> = ({ auditEntry, isOpen, onClose }) => {
  if (!isOpen || !auditEntry) return null;

  let ResultIcon = CheckCircle2;
  let resultColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';

  if (auditEntry.result === 'Failed' || auditEntry.result === 'Rejected') {
    ResultIcon = XCircle;
    resultColor = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (auditEntry.result === 'PreconditionRequired') {
    ResultIcon = AlertTriangle;
    resultColor = 'text-amber-600 bg-amber-50 border-amber-200';
  }

  let parsedDetails = null;
  if (auditEntry.detailsJson) {
    try { parsedDetails = JSON.parse(auditEntry.detailsJson); } catch { }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-96 bg-white border-l border-slate-300 shadow-2xl flex flex-col h-full text-xs font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <FileText className="h-4 w-4 text-[#0F6CBD]" />
            <span>Audit Record Details</span>
          </div>
          <button onClick={onClose} aria-label="Close audit detail drawer" className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className={`p-3 border rounded-md flex items-center justify-between ${resultColor}`}>
            <div className="flex items-center gap-2 font-semibold">
              <ResultIcon className="h-4 w-4 shrink-0" />
              <span>Result: {auditEntry.result}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">{auditEntry.id.substring(0, 8)}</span>
          </div>

          <div className="space-y-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-700">Timestamp (UTC):</span>
            </div>
            <div className="font-mono text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
              {new Date(auditEntry.timestamp).toUTCString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <User className="h-3 w-3" /> Actor
              </div>
              <div className="font-semibold text-slate-900">{auditEntry.actor}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Shield className="h-3 w-3" /> Action
              </div>
              <div className="font-semibold text-[#0F6CBD]">{auditEntry.action}</div>
            </div>

            <div className="space-y-1 col-span-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Server className="h-3 w-3" /> Target Resource
              </div>
              <div className="font-mono font-medium text-slate-900">{auditEntry.target}</div>
            </div>

            <div className="space-y-1 col-span-2">
              <div className="text-slate-500 text-[11px]">Origin IP Address</div>
              <div className="font-mono text-slate-800">{auditEntry.ipAddress || '127.0.0.1'}</div>
            </div>
          </div>

          {parsedDetails && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="font-semibold text-slate-800 text-xs">Structured Event Payload:</div>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-md font-mono text-[11px] overflow-x-auto leading-tight">
                {JSON.stringify(parsedDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
