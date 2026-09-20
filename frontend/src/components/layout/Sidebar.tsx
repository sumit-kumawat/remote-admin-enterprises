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
  KeyRound,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAuthorizedForUsers = user?.role === 'SuperAdmin' || user?.role === 'Admin';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/endpoints', label: 'Endpoints', icon: Monitor },
    { path: '/deployments', label: 'Deployments', icon: PackageCheck },
    { path: '/licensing', label: 'KMS Management', icon: KeyRound },
    { path: '/discovery', label: 'Discovery', icon: Compass },
    { path: '/audit', label: 'Audit Logs', icon: FileSpreadsheet },
    ...(isAuthorizedForUsers ? [{ path: '/users', label: 'User Management', icon: Users }] : []),
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white text-slate-700 border-r border-slate-200 flex flex-col transition-all duration-200 shrink-0 select-none z-20 shadow-xs ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Brand Header */}
      <div className="h-12 border-b border-slate-200 flex items-center justify-between px-3 bg-slate-50">
        {!isCollapsed && (
          <button
            onClick={() => window.location.reload()}
            aria-label="Refresh current page"
            title="Click to refresh current page"
            className="flex items-center gap-2 overflow-hidden hover:opacity-80 transition-opacity focus:outline-none focus:ring-1 focus:ring-[#2F3EA0] rounded p-0.5 text-left"
          >
            <img
              src="/ra-logo.svg"
              alt="Remote Admin Logo"
              className="h-7 w-7 object-contain shrink-0"
            />
            <span className="font-bold text-xs tracking-tight text-slate-900 truncate">Remote Admin</span>
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={() => window.location.reload()}
            aria-label="Refresh current page"
            title="Click to refresh current page"
            className="hover:opacity-80 transition-opacity focus:outline-none rounded p-0.5"
          >
            <img
              src="/ra-logo.svg"
              alt="Remote Admin Logo"
              className="h-7 w-7 object-contain mx-auto"
            />
          </button>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-200 transition-colors ml-auto"
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
                    ? 'bg-[#2F3EA0] text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
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
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
            <span>Air-Gapped Console</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">v1.0.0 — Enterprise</div>
        </div>
      )}
    </aside>
  );
};
