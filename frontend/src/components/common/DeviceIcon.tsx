import React from 'react';
import { WindowsIcon } from './WindowsIcon';
import { LinuxIcon } from './LinuxIcon';
import { NetworkIcon } from './NetworkIcon';

interface DeviceIconProps {
  deviceType?: string | null;
  osName?: string | null;
  isWindows?: boolean;
  size?: number;
  className?: string;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({
  deviceType,
  osName,
  isWindows,
  size = 16,
  className = '',
}) => {
  const typeStr = (deviceType || osName || '').toLowerCase();

  if (isWindows === true || typeStr.includes('windows') || typeStr.includes('win')) {
    return <WindowsIcon size={size} className={className || 'text-[#0078D4]'} />;
  }

  if (typeStr.includes('linux') || typeStr.includes('ubuntu') || typeStr.includes('debian') || typeStr.includes('rhel') || typeStr.includes('centos') || typeStr.includes('ssh')) {
    return <LinuxIcon size={size} className={className || 'text-slate-800'} />;
  }

  if (typeStr.includes('network') || typeStr.includes('router') || typeStr.includes('switch') || typeStr.includes('icmp')) {
    return <NetworkIcon size={size} className={className || 'text-amber-600'} />;
  }

  return <WindowsIcon size={size} className={className || 'text-[#0078D4]'} />;
};
