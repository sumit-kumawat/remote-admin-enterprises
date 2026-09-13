import React, { useState, useRef, useEffect } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { NotificationsDrawer } from './NotificationsDrawer';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Key, LogOut, Settings, Loader2 } from 'lucide-react';
import { DeviceIcon } from '../common/DeviceIcon';
import { apiClient } from '../../api/client';

interface SearchResultEndpoint {
  id: string;
  hostname: string;
  fqdn?: string;
  ipAddress?: string;
  macAddress?: string;
  status: string;
  authStatus: string;
  authUser?: string;
  deviceType: string;
  osName?: string;
}

export const Header: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultEndpoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsDropdownOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Debounced search API call
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.get<SearchResultEndpoint[]>(
          `/Endpoints/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        setSearchResults(response.data || []);
        setIsDropdownOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSelectEndpoint = (id: string) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    navigate(`/endpoints/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelectEndpoint(searchResults[selectedIndex].id);
      } else if (searchResults.length > 0) {
        handleSelectEndpoint(searchResults[0].id);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSignOut = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 font-sans z-20">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Breadcrumb />
      </div>

      {/* Right: Global Endpoint Search, Notifications, User Menu */}
      <div className="flex items-center gap-3">
        {/* Global Endpoint Search */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Global search endpoints (hostname, IP, OS, user)..."
              aria-label="Global endpoint search"
              className="w-56 focus:w-72 transition-all duration-200 pl-8 pr-7 py-1 text-xs border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
            {isSearching && (
              <Loader2 className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#2F3EA0] animate-spin" />
            )}
          </div>

          {/* Search Dropdown Results */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-80 bg-white border border-slate-300 rounded-md shadow-lg py-1 z-30 text-xs animate-in fade-in duration-100 max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>Matching Endpoints ({searchResults.length})</span>
                <span className="text-slate-400 font-normal">Use ↑↓ & Enter</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs">
                  No endpoints found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((ep, idx) => (
                  <button
                    key={ep.id}
                    onClick={() => handleSelectEndpoint(ep.id)}
                    className={`w-full text-left px-3 py-2 border-b border-slate-50 flex items-center justify-between transition-colors ${
                      idx === selectedIndex ? 'bg-blue-50 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <DeviceIcon deviceType={ep.deviceType} osName={ep.osName} size={15} />
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 truncate">{ep.hostname}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                          <span>IP: {ep.ipAddress || '—'}</span>
                          {ep.authUser && <span>User: {ep.authUser}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 font-medium rounded ${
                          ep.status === 'Online'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ep.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

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
