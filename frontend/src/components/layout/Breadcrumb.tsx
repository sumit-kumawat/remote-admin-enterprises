import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  endpoints: 'Endpoints',
  users: 'User Management',
  deployments: 'Software Deployment',
  discovery: 'Endpoint Discovery',
  audit: 'Audit Logs',
  settings: 'System Settings',
  'change-password': 'Change Password',
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 font-sans">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-[#2F3EA0] transition-colors">
        <Home className="h-3.5 w-3.5" />
        <span>Root</span>
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = routeLabels[name] || name;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="h-3 w-3 mx-1 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">{label}</span>
            ) : (
              <Link to={routeTo} className="hover:text-[#2F3EA0] transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
