import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are no items matching your criteria at this time.',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-md my-4">
      <div className="p-3 bg-slate-100 rounded-full text-slate-500 mb-3">
        <FolderOpen className="h-6 w-6" />
      </div>
      <h3 className="text-xs font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#2F3EA0] hover:bg-[#263385] rounded transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
