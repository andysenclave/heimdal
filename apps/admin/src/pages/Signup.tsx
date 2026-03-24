import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@api/client';
import { tokenStore } from '@api/tokenStore';
import { useAuth } from '@auth/hooks/useAuth';
import { validateInviteCode } from '@api/hooks/useInvites';
import { signupSchema, type SignupFormData } from '@lib/validation';
import { ROUTES } from '@lib/constants';
import type { AuthResponse } from '@api/types';

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetchSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [codeStatus, setCodeStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [emailLocked, setEmailLocked] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const inviteCodeValue = watch('inviteCode');

  const validateCode = useCallback(async (code: string) => {
    if (!/^HMD-[A-HJ-NP-Z2-9]{5}$/.test(code)) {
      setCodeStatus('invalid');
      setCodeError('Invalid invite code format');
      setEmailLocked(false);
      return;
    }

    setCodeStatus('validating');
    setCodeError(null);
    try {
      const result = await validateInviteCode(code);
      if (result.valid && result.email) {
        setCodeStatus('valid');
        setCodeError(null);
        setValue('email', result.email);
        setEmailLocked(true);
      } else {
        setCodeStatus('invalid');
        setCodeError('This invite code is invalid, expired, or has been revoked');
        setEmailLocked(false);
      }
    } catch {
      setCodeStatus('invalid');
      setCodeError('Could not validate invite code');
      setEmailLocked(false);
    }
  }, [setValue]);

  // Auto-validate if code is in URL query params
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setValue('inviteCode', codeFromUrl);
      validateCode(codeFromUrl);
    }
  }, [searchParams, setValue, validateCode]);

  const handleCodeBlur = () => {
    if (inviteCodeValue && inviteCodeValue.length >= 9) {
      validateCode(inviteCodeValue);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    try {
      const response = await api
        .post('auth/signup', {
          json: {
            email: data.email,
            password: data.password,
            name: data.name,
            inviteCode: data.inviteCode,
          },
        })
        .json<AuthResponse>();

      tokenStore.setTokens(response.accessToken, response.refreshToken);
      setEmailSent(data.email);

      await new Promise((r) => setTimeout(r, 1400));
      await refetchSession();
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('409')) {
          setServerError('An account with that email already exists.');
        } else if (msg.includes('400')) {
          // Try to extract the specific error from the response
          try {
            const body = JSON.parse(msg.split(' - ')[1] || '{}');
            setServerError(body.message || 'Invalid request. Please check your invite code and try again.');
          } catch {
            setServerError('Invalid request. Please check your invite code and try again.');
          }
        } else {
          setServerError('Something went wrong. Please try again.');
        }
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  const inputClass =
    'w-full rounded border border-deco-border bg-deco-bg px-3 py-2.5 font-mono text-sm text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none';
  const labelClass =
    'mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper';
  const errorClass = 'mt-1 font-mono text-[10px] text-deco-red';

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
            INVITE · SIGNUP
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
            {/* Invite Code */}
            <div>
              <label className={labelClass}>Invite Code</label>
              <div className="relative">
                <input
                  type="text"
                  {...register('inviteCode')}
                  onBlur={handleCodeBlur}
                  className={`${inputClass} pr-8 uppercase ${
                    codeStatus === 'valid'
                      ? 'border-green-500/50'
                      : codeStatus === 'invalid'
                        ? 'border-deco-red/50'
                        : ''
                  }`}
                  placeholder="HMD-XXXXX"
                  autoComplete="off"
                />
                {codeStatus === 'validating' && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 rounded-full border-2 border-deco-amber border-t-transparent animate-spin" />
                  </div>
                )}
                {codeStatus === 'valid' && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-green-500">
                    ✓
                  </div>
                )}
              </div>
              {errors.inviteCode && <p className={errorClass}>{errors.inviteCode.message}</p>}
              {codeError && <p className={errorClass}>{codeError}</p>}
            </div>

            {/* Name */}
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                {...register('name')}
                className={inputClass}
                placeholder="Jane Smith"
                autoComplete="name"
              />
              {errors.name && <p className={errorClass}>{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                {...register('email')}
                className={`${inputClass} ${emailLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
                readOnly={emailLocked}
              />
              {emailLocked && (
                <p className="mt-1 font-mono text-[10px] text-green-500/80">
                  Pre-filled from invite — this field is locked
                </p>
              )}
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                {...register('password')}
                className={inputClass}
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
              {errors.password && <p className={errorClass}>{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={inputClass}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className={errorClass}>{errors.confirmPassword.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded border border-deco-red/30 bg-deco-red/10 px-3 py-2 font-mono text-xs text-deco-red">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || codeStatus === 'invalid' || codeStatus === 'validating'}
              className="w-full rounded bg-gradient-to-br from-deco-amber to-deco-amber-dim py-2.5 font-display text-sm font-bold tracking-deco-tight text-deco-bg shadow-deco-glow transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Login link */}
        <p className="mt-6 text-center font-mono text-[10px] text-deco-text-dim">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-deco-amber transition-opacity hover:opacity-80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
