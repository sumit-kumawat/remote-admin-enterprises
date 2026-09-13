import React from 'react';

interface ApprovalBadgeProps {
  status?: string | null;
}

export const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({ status }) => {
  const norm = (status || 'pendingapproval').toLowerCase();

  let colors = 'bg-amber-50 text-amber-800 border-amber-300';
  let label = 'Pending Approval';

  if (norm === 'approved') {
    colors = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    label = 'Approved';
  } else if (norm === 'rejected') {
    colors = 'bg-rose-50 text-rose-800 border-rose-300';
    label = 'Rejected';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded ${colors}`}>
      {label}
    </span>
  );
};
