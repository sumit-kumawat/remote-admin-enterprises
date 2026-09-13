import React, { useState } from 'react';
import { useUsersList } from '../../hooks/useAuth';
import type { UserDto } from '../../types/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AddUserModal } from '../../components/modals/AddUserModal';
import { ChangeRoleModal } from '../../components/modals/ChangeRoleModal';
import { DeleteUserModal } from '../../components/modals/DeleteUserModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useDeactivateUser } from '../../hooks/useAuth';
import { UserPlus, Shield, RefreshCw, Trash2, UserX, KeyRound } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { data: users = [], isLoading, isError, refetch } = useUsersList();
  const deactivateMutation = useDeactivateUser();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserDto | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserDto | null>(null);
  const [selectedUserForDeactivate, setSelectedUserForDeactivate] = useState<UserDto | null>(null);

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const handleConfirmDeactivate = () => {
    if (selectedUserForDeactivate) {
      deactivateMutation.mutate(selectedUserForDeactivate.id, {
        onSuccess: () => setSelectedUserForDeactivate(null),
      });
    }
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-md shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">User Account & Permission Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage console operators, administrative roles, and active accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            aria-label="Refresh users list"
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F3EA0] hover:bg-[#263385] rounded transition-colors shadow-xs"
          >
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="p-2.5">User Details</th>
                <th className="p-2.5">Role</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Must Change Password</th>
                <th className="p-2.5">Last Login</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-2.5">
                    <div className="font-semibold text-slate-900">{u.username}</div>
                    <div className="text-[11px] text-slate-500">{u.email || 'No email registered'}</div>
                  </td>
                  <td className="p-2.5 font-semibold text-[#2F3EA0]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
                      <Shield className="h-3 w-3" /> {u.role}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <StatusBadge status={u.isActive ? 'Active' : 'Offline'} size="sm" />
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">
                    {u.mustChangePassword ? (
                      <span className="text-amber-600 font-semibold">Yes (Pending)</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">No</span>
                    )}
                  </td>
                  <td className="p-2.5 font-mono text-slate-500">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="p-2.5 text-right space-x-1">
                    {u.username.toLowerCase() === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-300 rounded">
                        <Shield className="h-3 w-3 text-[#2F3EA0]" /> Protected System Account
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedUserForRole(u)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
                        >
                          <KeyRound className="h-3 w-3 text-slate-500" /> Change Role
                        </button>
                        {u.isActive && (
                          <button
                            onClick={() => setSelectedUserForDeactivate(u)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50 border border-amber-300 rounded transition-colors"
                          >
                            <UserX className="h-3 w-3 text-amber-600" /> Deactivate
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedUserForDelete(u)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 border border-rose-300 rounded transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-rose-600" /> Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <ChangeRoleModal user={selectedUserForRole} isOpen={Boolean(selectedUserForRole)} onClose={() => setSelectedUserForRole(null)} />
      <DeleteUserModal user={selectedUserForDelete} isOpen={Boolean(selectedUserForDelete)} onClose={() => setSelectedUserForDelete(null)} />

      <ConfirmModal
        isOpen={Boolean(selectedUserForDeactivate)}
        onClose={() => setSelectedUserForDeactivate(null)}
        onConfirm={handleConfirmDeactivate}
        title={`Deactivate User: ${selectedUserForDeactivate?.username}`}
        message={`Are you sure you want to deactivate user account '${selectedUserForDeactivate?.username}'? The user will be immediately blocked from signing in.`}
        confirmText="Deactivate User"
        isDanger={true}
        isLoading={deactivateMutation.isPending}
      />
    </div>
  );
};
