import React from 'react';
import { DiscoverySubnav } from './DiscoverySubnav';
import { SlidersHorizontal, ShieldAlert, Cpu, Database } from 'lucide-react';

export const DiscoverySettingsPage: React.FC = () => {
  return (
    <div className="space-y-4 text-xs font-sans">
      <DiscoverySubnav />

      {/* Header */}
      <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-[#2F3EA0]" />
          Engine Configuration & Safety Guardrails
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of default scanning performance limits, IEEE OUI vendor database, and network safety parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Safety & Constraints Box */}
        <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs space-y-3">
          <h2 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <ShieldAlert className="h-4 w-4 text-[#2F3EA0]" />
            Safety Guardrails & Subnet Scoping
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Single Subnet Target Scope</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Enforced Strictly
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Maximum Prefix Length Cap</span>
              <span className="font-mono font-bold text-slate-800">/22 (1022 hosts max)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Ownership Acknowledgment Guard</span>
              <span className="font-bold text-blue-700">Mandatory (ConfirmedOwnership = true)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Audit Log Integration</span>
              <span className="font-bold text-slate-800">Every Scan & Promotion Audit-Logged</span>
            </div>
          </div>
        </div>

        {/* Engine Performance Box */}
        <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs space-y-3">
          <h2 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Cpu className="h-4 w-4 text-[#2F3EA0]" />
            Engine Concurrency & Rate Limits
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Bounded TCP Concurrency</span>
              <span className="font-mono font-bold text-slate-800">500 SemaphoreSlim Slots</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Bounded ARP Concurrency</span>
              <span className="font-mono font-bold text-slate-800">2000 SemaphoreSlim Slots</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Token Bucket Rate Limiter</span>
              <span className="font-mono font-bold text-slate-800">5000 pps (Packets / Sec)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Reverse DNS Timeout</span>
              <span className="font-mono font-bold text-slate-800">1000 ms Hard Limit</span>
            </div>
          </div>
        </div>

        {/* IEEE OUI Database Status */}
        <div className="bg-white p-4 border border-slate-200 rounded-md shadow-xs space-y-3 md:col-span-2">
          <h2 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Database className="h-4 w-4 text-[#2F3EA0]" />
            IEEE MAC OUI Vendor Lookup Database
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">Bundled IEEE OUI Lookup Table</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Translates hardware MAC prefixes (e.g., <span className="font-mono">00:15:5D</span> → Microsoft,{' '}
                <span className="font-mono">00:0C:29</span> → VMware) instantly in memory.
              </p>
            </div>

            <div className="px-3 py-1 bg-emerald-100 border border-emerald-300 rounded text-emerald-900 font-bold">
              Database Loaded & Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
