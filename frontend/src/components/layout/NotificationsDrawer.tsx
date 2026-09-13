import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Bell, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { fetchAuditLogs } from '../../api/auditApi';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['audit-notifications'],
    queryFn: () => fetchAuditLogs(),
    enabled: isOpen,
    refetchInterval: 10000,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-2xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-80 bg-white border-l border-slate-300 shadow-2xl flex flex-col h-full text-xs font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-[#2F3EA0]" />
            <span>Notifications</span>
            {notifications.length > 0 && (
              <span className="text-[10px] bg-[#2F3EA0] text-white px-1.5 py-0.2 rounded-full font-bold">
                {notifications.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close notifications drawer"
            className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-200/60 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#2F3EA0]" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">No notifications</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time system events will appear here.</p>
            </div>
          ) : (
            notifications.slice(0, 20).map((n) => {
              const isFailed = n.result === 'Failed' || n.result === 'Rejected';
              const isWarn = n.result === 'PreconditionRequired';
              return (
                <div
                  key={n.id}
                  className="p-2.5 border border-slate-200 rounded-md bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isFailed ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    ) : isWarn ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-900 text-xs">{n.action}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    <span className="font-medium text-slate-800">{n.actor}</span> — {n.target} ({n.result})
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                    {new Date(n.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
