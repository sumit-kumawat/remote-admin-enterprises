import React from 'react';

interface NetworkIconProps {
  size?: number;
  className?: string;
}

export const NetworkIcon: React.FC<NetworkIconProps> = ({ size = 16, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Network Device Icon"
      role="img"
    >
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
      <line x1="10" y1="18" x2="10.01" y2="18" />
      <line x1="14" y1="18" x2="14.01" y2="18" />
      <path d="M12 2v12" />
      <path d="M7 6v2" />
      <path d="M17 6v2" />
      <path d="M4 6h16" />
    </svg>
  );
};
