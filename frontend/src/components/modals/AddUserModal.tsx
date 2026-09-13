import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { useCreateUser } from '../../hooks/useAuth';

const schema = z
  .object({
    username: z.string().min(1, 'Username is required').max(100, 'Username too long'),
    email: z.string().email('Invalid email address').or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    passwordConfirmation: z.string().min(8, 'Password confirmation is required'),
    role: z.enum(['SuperAdmin', 'Admin', 'Operator', 'Auditor', 'Viewer']),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  });

type FormValues = z.infer<typeof schema>;

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose }) => {
  const createMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      role: 'Viewer',
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(
      {
        username: data.username,
        email: data.email || null,
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
        role: data.role,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New User Account" subtitle="Create an administrative or operator user account" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Username <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('username')}
            placeholder="e.g. operator1"
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
          />
          {errors.username && <p className="text-xs text-rose-600 mt-0.5">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            {...register('email')}
            placeholder="e.g. operator1@enterprise.local"
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
          />
          {errors.email && <p className="text-xs text-rose-600 mt-0.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Role <span className="text-rose-500">*</span>
          </label>
          <select
            {...register('role')}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
          >
            <option value="Viewer">Viewer — Read-only console access</option>
            <option value="Auditor">Auditor — View inventory & audit logs</option>
            <option value="Operator">Operator — Deploy software & run scans</option>
            <option value="Admin">Admin — Full system management</option>
            <option value="SuperAdmin">SuperAdmin — Full access + User management</option>
          </select>
          {errors.role && <p className="text-xs text-rose-600 mt-0.5">{errors.role.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
            />
            {errors.password && <p className="text-xs text-rose-600 mt-0.5">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              {...register('passwordConfirmation')}
              placeholder="••••••••"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
            />
            {errors.passwordConfirmation && (
              <p className="text-xs text-rose-600 mt-0.5">{errors.passwordConfirmation.message}</p>
            )}
          </div>
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
            disabled={createMutation.isPending}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
