import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { ToastContainer } from '../../components/common/ToastContainer';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  const loginMutation = useLogin();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        if (response.mustChangePassword) {
          navigate('/change-password');
        } else {
          navigate('/dashboard');
        }
      },
    });
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-900 font-sans p-4 relative overflow-hidden select-none">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white rounded-lg shadow-2xl border border-slate-800 p-6 z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#0F6CBD] text-white shadow-md mb-1">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Remote Admin Enterprises</h1>
          <p className="text-xs text-slate-500 font-medium">Air-Gapped Windows Server & Endpoint Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {loginMutation.isError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Authentication Failed</span>
              </div>
              <p className="text-rose-700">
                {(loginMutation.error as any)?.response?.data?.message || 'Invalid username or password.'}
              </p>
              <div className="pt-1 border-t border-rose-200 text-[11px] text-slate-600 font-mono">
                Default Credentials: <span className="font-bold text-slate-800">admin</span> / <span className="font-bold text-slate-800">Adm1n@123</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <User className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                {...register('username')}
                placeholder="Enter username"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] focus:border-transparent transition-all"
              />
            </div>
            {errors.username && <p className="text-xs text-rose-600 mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] focus:border-transparent transition-all"
              />
            </div>
            {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-2.5 px-4 bg-[#0F6CBD] hover:bg-[#005a9e] text-white font-semibold text-xs rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] focus:ring-offset-2 disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">Enterprise Endpoint Console • v1.0.0</p>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};
