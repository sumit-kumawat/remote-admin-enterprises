import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, History, CalendarClock, SlidersHorizontal } from 'lucide-react';

export const DiscoverySubnav: React.FC = () => {
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
    </div>
  );
};
