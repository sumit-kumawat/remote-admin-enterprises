import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to Load Data',
  message = 'An unexpected error occurred while fetching information from the server.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 border border-rose-200 rounded-md my-4">
      <div className="p-3 bg-rose-100 rounded-full text-rose-600 mb-3">
        <AlertOctagon className="h-6 w-6" />
      </div>
      <h3 className="text-xs font-semibold text-rose-900">{title}</h3>
      <p className="text-xs text-rose-700 max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry Request
        </button>
      )}
    </div>
  );
};
