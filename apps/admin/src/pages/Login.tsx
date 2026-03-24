import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@api/client';
import { useAuth } from '@auth/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@lib/validation';
import { ROUTES } from '@lib/constants';

export default function Login() {
  const navigate = useNavigate();
  const { refetchSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await api.post('auth/login', { json: data });
      await refetchSession();
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch {
      setServerError('Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-deco-bg">
      <div className="relative w-full max-w-sm rounded-lg border border-deco-border bg-deco-surface p-8 shadow-deco-card">
        {/* Gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg bg-gradient-to-r from-transparent via-deco-amber to-transparent" />

        {/* L-bracket corners */}
        <div className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-deco-copper/40" />
        <div className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-deco-copper/40" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-deco-copper/40" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-deco-copper/40" />

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-deco-amber to-deco-copper">
            <span className="font-mono text-lg font-black text-deco-bg">H</span>
          </div>
          <h1 className="font-display text-xl font-bold tracking-deco-wider text-deco-text">HEIMDAL</h1>
          <p className="mt-1 font-mono text-[9px] tracking-deco-widest text-deco-copper">ADMIN · PANEL</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded border border-deco-border bg-deco-bg px-3 py-2.5 font-mono text-sm text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none"
              placeholder="admin@example.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 font-mono text-[10px] text-deco-red">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              className="w-full rounded border border-deco-border bg-deco-bg px-3 py-2.5 font-mono text-sm text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="mt-1 font-mono text-[10px] text-deco-red">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded border border-deco-red/30 bg-deco-red/10 px-3 py-2 font-mono text-xs text-deco-red">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-gradient-to-br from-deco-amber to-deco-amber-dim py-2.5 font-display text-sm font-bold tracking-deco-tight text-deco-bg shadow-deco-glow transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
