import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LayoutDashboard,
  Monitor,
  PackageCheck,
  Compass,
  FileSpreadsheet,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAuthorizedForUsers = user?.role === 'SuperAdmin' || user?.role === 'Admin';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/endpoints', label: 'Endpoints', icon: Monitor },
    { path: '/deployments', label: 'Deployments', icon: PackageCheck },
    { path: '/discovery', label: 'Discovery', icon: Compass },
    { path: '/audit', label: 'Audit Logs', icon: FileSpreadsheet },
    ...(isAuthorizedForUsers ? [{ path: '/users', label: 'User Management', icon: Users }] : []),
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-all duration-200 shrink-0 select-none z-20 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Brand Header */}
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-3">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-6 w-6 bg-[#0F6CBD] rounded flex items-center justify-center font-bold text-white text-xs shrink-0">
              RA
            </div>
            <span className="font-bold text-xs tracking-tight text-white truncate">Remote Admin</span>
          </div>
        )}
        {isCollapsed && (
          <div className="h-6 w-6 bg-[#0F6CBD] rounded flex items-center justify-center font-bold text-white text-xs mx-auto">
            RA
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav aria-label="Main Navigation" className="flex-1 py-2 space-y-1 px-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded transition-all ${
                  isActive
                    ? 'bg-[#0F6CBD] text-white font-semibold border-l-4 border-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Status */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
            <span>Air-Gapped Console</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">v1.0.0 — Enterprise</div>
        </div>
      )}
    </aside>
  );
};
