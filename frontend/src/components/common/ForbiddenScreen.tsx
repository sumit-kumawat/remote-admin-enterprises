import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ForbiddenScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white border border-slate-200 rounded-md my-4">
      <div className="p-4 bg-rose-100 rounded-full text-rose-600 mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-lg font-bold text-slate-900 mb-1">403 — Access Denied</h1>
      <p className="text-xs text-slate-600 max-w-md mb-6 leading-relaxed">
        You do not have the required administrative permissions (SuperAdmin / Admin) to access this page. Please contact your system administrator if you believe this is an error.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
      </button>
    </div>
  );
};
