import React from 'react';
import { ConfirmModal } from '../common/ConfirmModal';
import { useDeleteUser } from '../../hooks/useAuth';
import type { UserDto } from '../../types/api';

interface DeleteUserModalProps {
  user: UserDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, isOpen, onClose }) => {
  const deleteMutation = useDeleteUser();

  if (!user) return null;

  const handleConfirm = () => {
    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Delete User: ${user.username}`}
      message={`Are you sure you want to permanently delete user account '${user.username}'? This action cannot be undone.`}
      confirmText="Delete Account"
      isDanger={true}
      requireMatchString={user.username}
      isLoading={deleteMutation.isPending}
    />
  );
};
