import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { AppLayout } from '../components/layout/AppLayout';

import { LoginPage } from '../pages/auth/LoginPage';
import { ChangePasswordPage } from '../pages/auth/ChangePasswordPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { EndpointsPage } from '../pages/endpoints/EndpointsPage';
import { EndpointDetailPage } from '../pages/endpoints/EndpointDetailPage';
import { UsersPage } from '../pages/users/UsersPage';
import { DeploymentsPage } from '../pages/deployments/DeploymentsPage';
import { DeploymentDetailPage } from '../pages/deployments/DeploymentDetailPage';

// Discovery Sub-Pages
import { DiscoveryConsolePage } from '../pages/discovery/DiscoveryConsolePage';
import { ScanHistoryPage } from '../pages/discovery/ScanHistoryPage';
import { ScanDetailPage } from '../pages/discovery/ScanDetailPage';
import { ScanSchedulesPage } from '../pages/discovery/ScanSchedulesPage';
import { DiscoverySettingsPage } from '../pages/discovery/DiscoverySettingsPage';

import { AuditLogPage } from '../pages/audit/AuditLogPage';
import { SettingsPage } from '../pages/settings/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Unauthenticated Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Mandatory Password Change Route */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* Main Authenticated Application Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/endpoints" element={<EndpointsPage />} />
        <Route path="/endpoints/:id" element={<EndpointDetailPage />} />
        <Route
          path="/users"
          element={
            <RoleGuard allowedRoles={['SuperAdmin', 'Admin']}>
              <UsersPage />
            </RoleGuard>
          }
        />
        <Route path="/deployments" element={<DeploymentsPage />} />
        <Route path="/deployments/:id" element={<DeploymentDetailPage />} />

        {/* Discovery Routes */}
        <Route path="/discovery" element={<DiscoveryConsolePage />} />
        <Route path="/discovery/scans" element={<ScanHistoryPage />} />
        <Route path="/discovery/scans/:id" element={<ScanDetailPage />} />
        <Route path="/discovery/schedules" element={<ScanSchedulesPage />} />
        <Route path="/discovery/settings" element={<DiscoverySettingsPage />} />

        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Default Fallback Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
