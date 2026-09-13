import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChangePassword } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert, Lock, AlertCircle } from 'lucide-react';
import { ToastContainer } from '../../components/common/ToastContainer';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
    newPasswordConfirmation: z.string().min(8, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: 'Passwords do not match',
    path: ['newPasswordConfirmation'],
  });

type FormValues = z.infer<typeof schema>;

export const ChangePasswordPage: React.FC = () => {
  const changePasswordMutation = useChangePassword();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirmation: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        navigate('/dashboard');
      },
    });
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-900 font-sans p-4 relative select-none">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-800 p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-amber-500 text-white shadow-md mb-1">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Password Change Required</h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Your account requires a password update before accessing administrative resources.
          </p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>For security reasons, your default bootstrap administrator password must be updated immediately.</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {changePasswordMutation.isError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Password Change Error</span>
                <span>{(changePasswordMutation.error as any)?.response?.data?.message || 'Failed to change password'}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="currentPassword">
              Current Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="currentPassword"
                type="password"
                {...register('currentPassword')}
                placeholder="Enter current password (e.g. Adm1n@123)"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
              />
            </div>
            {errors.currentPassword && <p className="text-xs text-rose-600 mt-1">{errors.currentPassword.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="newPassword">
              New Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                placeholder="Enter new password (at least 8 chars)"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
              />
            </div>
            {errors.newPassword && <p className="text-xs text-rose-600 mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="newPasswordConfirmation">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="newPasswordConfirmation"
                type="password"
                {...register('newPasswordConfirmation')}
                placeholder="Confirm new password"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
              />
            </div>
            {errors.newPasswordConfirmation && (
              <p className="text-xs text-rose-600 mt-1">{errors.newPasswordConfirmation.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="w-full py-2.5 px-4 bg-[#2F3EA0] hover:bg-[#263385] text-white font-semibold text-xs rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2F3EA0] disabled:opacity-50"
          >
            {changePasswordMutation.isPending ? 'Updating Password...' : 'Update Password & Continue'}
          </button>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
};
