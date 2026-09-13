import React from 'react';

interface DeviceIconProps {
  deviceType?: string | null;
  osName?: string | null;
  isWindows?: boolean;
  size?: number;
  className?: string;
}

const WINDOWS_ICON_URL = 'https://cdn-icons-png.flaticon.com/512/882/882702.png';
const LINUX_ICON_URL = 'https://cdn-icons-png.flaticon.com/512/6124/6124995.png';
const NETWORK_ICON_URL = 'https://cdn-icons-png.flaticon.com/512/16889/16889236.png';

export const DeviceIcon: React.FC<DeviceIconProps> = ({
  deviceType,
  osName,
  isWindows,
  size = 16,
  className = '',
}) => {
  const typeStr = (deviceType || osName || '').toLowerCase();

  let iconUrl = WINDOWS_ICON_URL;
  let altText = 'Windows Device';

  if (typeStr.includes('linux') || typeStr.includes('ubuntu') || typeStr.includes('debian') || typeStr.includes('rhel') || typeStr.includes('centos') || typeStr.includes('ssh')) {
    iconUrl = LINUX_ICON_URL;
    altText = 'Linux Device';
  } else if (typeStr.includes('network') || typeStr.includes('router') || typeStr.includes('switch') || typeStr.includes('icmp')) {
    iconUrl = NETWORK_ICON_URL;
    altText = 'Network Device';
  } else if (isWindows === true || typeStr.includes('windows') || typeStr.includes('win')) {
    iconUrl = WINDOWS_ICON_URL;
    altText = 'Windows Device';
  }

  return (
    <img
      src={iconUrl}
      alt={altText}
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`inline-block object-contain ${className}`}
    />
  );
};
