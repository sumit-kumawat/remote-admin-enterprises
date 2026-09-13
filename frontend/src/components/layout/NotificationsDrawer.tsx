import React from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const mockNotifications = [
    { id: '1', title: 'Agent Update Available', message: 'Agent v2.4.1 ready for deployment', time: '10 mins ago', type: 'info' },
    { id: '2', title: 'Endpoint Discovered', message: 'New host WIN11-EXEC-01 detected in 192.168.1.0/24', time: '1 hour ago', type: 'success' },
    { id: '3', title: 'Deployment Warning', message: '2 targets failed in Job JOB-101', time: '2 hours ago', type: 'warning' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-80 bg-white border-l border-slate-300 shadow-2xl flex flex-col h-full text-xs font-sans">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-[#0F6CBD]" />
            <span>Notifications</span>
          </div>
          <button onClick={onClose} aria-label="Close notifications drawer" className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {mockNotifications.map((n) => (
            <div key={n.id} className="p-3 border border-slate-200 rounded-md bg-slate-50/50 hover:bg-slate-100/60 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                {n.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                {n.type === 'success' && <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                {n.type === 'info' && <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                <span className="font-semibold text-slate-900 text-xs">{n.title}</span>
              </div>
              <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
