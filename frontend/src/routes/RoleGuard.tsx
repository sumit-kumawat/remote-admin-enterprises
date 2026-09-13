import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { ForbiddenScreen } from '../components/common/ForbiddenScreen';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <ForbiddenScreen />;
  }

  return <>{children}</>;
};
