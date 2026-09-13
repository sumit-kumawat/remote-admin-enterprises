import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useUpdateUserRole } from '../../hooks/useAuth';
import type { UserDto } from '../../types/api';

interface ChangeRoleModalProps {
  user: UserDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({ user, isOpen, onClose }) => {
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'Viewer');
  const updateRoleMutation = useUpdateUserRole();

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRoleMutation.mutate(
      { id: user.id, role: selectedRole },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Change Role: ${user.username}`} maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
          >
            <option value="Viewer">Viewer — Read-only access</option>
            <option value="Auditor">Auditor — View inventory & audit logs</option>
            <option value="Operator">Operator — Deploy software & run scans</option>
            <option value="Admin">Admin — Full system management</option>
            <option value="SuperAdmin">SuperAdmin — Full access + User management</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateRoleMutation.isPending}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#2F3EA0] hover:bg-[#263385] rounded transition-colors disabled:opacity-50"
          >
            {updateRoleMutation.isPending ? 'Updating...' : 'Save Role'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
