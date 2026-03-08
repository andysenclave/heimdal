import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@api/client';
import { tokenStore } from '@api/tokenStore';
import { useAuth } from '@auth/hooks/useAuth';
import { signupSchema, type SignupFormData } from '@lib/validation';
import { ROUTES } from '@lib/constants';
import type { AuthResponse } from '@api/types';

export default function Signup() {
  const navigate = useNavigate();
  const { refetchSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    try {
      const response = await api
        .post('auth/signup', {
          json: { email: data.email, password: data.password, name: data.name },
        })
        .json<AuthResponse>();

      tokenStore.setTokens(response.accessToken, response.refreshToken);
      setEmailSent(data.email);

      // Brief pause so the success message is visible before navigating
      await new Promise((r) => setTimeout(r, 1400));
      await refetchSession();
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes('409')
          ? 'An account with that email already exists.'
          : 'Something went wrong. Please try again.';
      setServerError(msg);
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
          <h1 className="font-display text-xl font-bold tracking-deco-wider text-deco-text">
            HEIMDAL
          </h1>
          <p className="mt-1 font-mono text-[9px] tracking-deco-widest text-deco-copper">
            CREATE ACCOUNT
          </p>
        </div>

        {/* Email verification notice */}
        {emailSent ? (
          <div className="rounded border border-deco-amber/30 bg-deco-amber/10 px-4 py-3 text-center">
            <p className="font-mono text-xs text-deco-amber">
              Account created — check <span className="font-bold">{emailSent}</span> to verify your
              address.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                Full Name
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full rounded border border-deco-border bg-deco-bg px-3 py-2.5 font-mono text-sm text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none"
                placeholder="Jane Smith"
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1 font-mono text-[10px] text-deco-red">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded border border-deco-border bg-deco-bg px-3 py-2.5 font-mono text-sm text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 font-mono text-[10px] text-deco-red">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full rounded border border-deco-border bg-deco-bg px-3 py-2.5 font-mono text-sm text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none"
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="mt-1 font-mono text-[10px] text-deco-red">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                Confirm Password
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className="w-full rounded border border-deco-border bg-deco-bg px-3 py-2.5 font-mono text-sm text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 font-mono text-[10px] text-deco-red">
                  {errors.confirmPassword.message}
                </p>
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
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Login link */}
        <p className="mt-6 text-center font-mono text-[10px] text-deco-text-dim">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-deco-amber transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
