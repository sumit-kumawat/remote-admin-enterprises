import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, History, CalendarClock, SlidersHorizontal, Radio } from 'lucide-react';
import type { SignalRConnectionStatus } from '../../hooks/useDiscoveryHub';

interface DiscoverySubnavProps {
  connectionStatus?: SignalRConnectionStatus;
}

export const DiscoverySubnav: React.FC<DiscoverySubnavProps> = ({ connectionStatus }) => {
  const tabs = [
    { to: '/discovery', label: 'Scanner Console', icon: Compass, end: true },
    { to: '/discovery/scans', label: 'Scan History', icon: History },
    { to: '/discovery/schedules', label: 'Schedules', icon: CalendarClock },
    { to: '/discovery/settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 pt-2 shadow-xs mb-4">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#2F3EA0] text-[#2F3EA0]'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>

      {connectionStatus && (
        <div className="flex items-center gap-2 text-[11px] pb-2 font-medium">
          <Radio className="h-3.5 w-3.5 text-slate-400" />
          <span>SignalR:</span>
          {connectionStatus === 'connected' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live (Connected)
            </span>
          )}
          {connectionStatus === 'reconnecting' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse"></span>
              Reconnecting...
            </span>
          )}
          {(connectionStatus === 'disconnected' || connectionStatus === 'connecting') && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
