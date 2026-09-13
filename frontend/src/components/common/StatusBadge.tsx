import React from 'react';

interface StatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || 'unknown').toLowerCase();

  let colors = 'bg-gray-100 text-gray-700 border-gray-300';
  let dotColor = 'bg-gray-400';
  let label = status || 'Unknown';

  if (norm === 'online' || norm === 'healthy' || norm === 'completed' || norm === 'ready') {
    colors = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dotColor = 'bg-emerald-500';
  } else if (norm === 'offline' || norm === 'failed' || norm === 'deprecated') {
    colors = 'bg-rose-50 text-rose-800 border-rose-300';
    dotColor = 'bg-rose-500';
  } else if (norm === 'pending' || norm === 'unknown' || norm === 'queued' || norm === 'needsupdate') {
    colors = 'bg-amber-50 text-amber-800 border-amber-300';
    dotColor = 'bg-amber-500';
  } else if (norm === 'running' || norm === 'scanning') {
    colors = 'bg-blue-50 text-blue-800 border-blue-300';
    dotColor = 'bg-blue-500 animate-pulse';
  }

  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium border rounded ${colors} ${padding}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
