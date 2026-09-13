import React, { useState, useRef, useEffect } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { NotificationsDrawer } from './NotificationsDrawer';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Key, LogOut, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearAuth();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/endpoints?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 font-sans z-20">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Breadcrumb />
      </div>

      {/* Right: Global Search, Notifications, User Menu */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Global search endpoints..."
            className="w-48 focus:w-64 transition-all duration-200 pl-8 pr-3 py-1 text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
          />
        </form>

        {/* Notifications Button */}
        <button
          onClick={() => setIsNotificationsOpen(true)}
          aria-label="View notifications"
          className="relative p-1.5 text-slate-600 hover:text-[#2F3EA0] hover:bg-slate-100 rounded transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#2F3EA0]" />
        </button>

        {/* User Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-label="User account menu"
            className="flex items-center gap-2 px-2 py-1 border border-slate-200 hover:border-slate-300 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="h-5 w-5 rounded-full bg-[#2F3EA0] text-white flex items-center justify-center font-bold text-[10px]">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-xs font-semibold text-slate-800">{user?.username || 'User'}</span>
            <span className="text-[10px] px-1.5 py-0.2 font-medium bg-slate-200 text-slate-700 rounded">
              {user?.role || 'Viewer'}
            </span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-300 rounded-md shadow-lg py-1 z-30 text-xs animate-in fade-in duration-100">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <div className="font-semibold text-slate-900">{user?.username}</div>
                <div className="text-[11px] text-slate-500">{user?.email || 'System Account'}</div>
              </div>

              <Link
                to="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-slate-500" />
                <span>System Settings</span>
              </Link>

              <Link
                to="/change-password"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Key className="h-3.5 w-3.5 text-slate-500" />
                <span>Change Password</span>
              </Link>

              <div className="border-t border-slate-100 my-0.5" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </header>
  );
};
