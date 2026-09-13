import React from 'react';

interface WindowsIconProps {
  className?: string;
  size?: number;
}

export const WindowsIcon: React.FC<WindowsIconProps> = ({ className = 'h-4 w-4 text-[#0078D4]', size = 16 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 12.402l35.687-4.86.016 34.423-35.67.202zm35.67 33.527l.028 34.453L0 75.542l.033-29.414zm4.269-38.98L88 0v41.229l-48.061.272zm48.061 38.634V88L39.939 81.282l.024-34.901z" />
    </svg>
  );
};
