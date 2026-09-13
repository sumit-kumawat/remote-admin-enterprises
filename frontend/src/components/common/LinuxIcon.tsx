import React from 'react';

interface LinuxIconProps {
  size?: number;
  className?: string;
}

export const LinuxIcon: React.FC<LinuxIconProps> = ({ size = 16, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label="Linux Host Icon"
      role="img"
    >
      <path d="M12.003 2c-2.21 0-4 1.79-4 4 0 1.25.57 2.36 1.47 3.09-.76 1.13-1.47 2.45-1.47 4.91 0 1.66.42 2.62 1 3.5.42.64.91 1.15 1.45 1.5-1.02.32-2.12.87-2.12 2 0 1.1 1.79 2 4 2s4-.9 4-2c0-1.13-1.1-1.68-2.12-2 .54-.35 1.03-.86 1.45-1.5.58-.88 1-1.84 1-3.5 0-2.46-.71-3.78-1.47-4.91.9-.73 1.47-1.84 1.47-3.09 0-2.21-1.79-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
    </svg>
  );
};
