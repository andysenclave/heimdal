import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@auth/hooks/useAuth';
import {
  DecoButton,
  DecoCard,
  DecoAvatar,
  DecoBadge,
  DecoSeparator,
  DecoInput,
  DecoToggle,
  decoToast,
} from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { useOrganization } from '@api/hooks/useOrganizations';
import { formatDate, formatRelative } from '@lib/format';
import type { SessionInfo } from '@/types/models';

// --- Schemas ---

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// --- Mock sessions ---

const MOCK_SESSIONS: SessionInfo[] = [
  {
    id: 'sess_01',
    userId: 'user_dev_mock',
    ipAddress: '192.168.1.42',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sess_02',
    userId: 'user_dev_mock',
    ipAddress: '10.0.0.15',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2) Safari/605.1',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sess_03',
    userId: 'user_dev_mock',
    ipAddress: '172.16.0.8',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/134.0',
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// --- Helpers ---

function parseUserAgent(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };
  let browser = 'Unknown';
  let os = 'Unknown';

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('iPhone')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
}

const DEVICE_ICONS: Record<string, string> = {
  macOS: '◈',
  Windows: '◇',
  iOS: '⊙',
  Android: '⬡',
  Linux: '⬢',
  Unknown: '○',
};

// --- Page ---

export default function Profile() {
  const { session, signOut } = useAuth();
  const { data: userOrg } = useOrganization(session?.orgId ?? '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [revokeSession, setRevokeSession] = useState<SessionInfo | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [auditDigest, setAuditDigest] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: session?.name ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  if (!session) return null;

  const handleProfileSave = async (data: ProfileForm) => {
    // Mock — would call API
    await new Promise((r) => setTimeout(r, 500));
    decoToast.success(`Display name updated to "${data.name}"`);
    setIsEditingProfile(false);
  };

  const handlePasswordChange = async (_data: PasswordForm) => {
    // Mock — would call API
    await new Promise((r) => setTimeout(r, 800));
    decoToast.success('Password updated successfully');
    passwordForm.reset();
    setIsChangingPassword(false);
  };

  const handleRevokeSession = async () => {
    if (!revokeSession) return;
    await new Promise((r) => setTimeout(r, 400));
    decoToast.success('Session revoked');
    setRevokeSession(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Account settings, security, and session management" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---- Account Card ---- */}
        <DecoCard title="Account">
          <div className="space-y-5">
            {/* Avatar + name header */}
            <div className="flex items-center gap-4">
              <DecoAvatar name={session.name ?? session.email} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold tracking-deco-tight text-deco-text">
                  {session.name ?? session.email.split('@')[0]}
                </div>
                <div className="font-mono text-[12px] text-deco-text-dim">{session.email}</div>
              </div>
              {!isEditingProfile && (
                <DecoButton variant="ghost" onClick={() => setIsEditingProfile(true)}>
                  Edit
                </DecoButton>
              )}
            </div>

            <DecoSeparator />

            {/* Editable profile form */}
            {isEditingProfile ? (
              <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
                <DecoInput
                  label="Display Name"
                  placeholder="Your name"
                  {...profileForm.register('name')}
                  error={profileForm.formState.errors.name?.message}
                />
                <div className="rounded border border-deco-border-dim bg-deco-bg px-3 py-2.5 text-[12px] text-deco-text-dim">
                  Email address changes must be done through your identity provider.
                </div>
                <div className="flex items-center justify-end gap-2">
                  <DecoButton
                    variant="ghost"
                    onClick={() => {
                      profileForm.reset();
                      setIsEditingProfile(false);
                    }}
                  >
                    Cancel
                  </DecoButton>
                  <DecoButton type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                  </DecoButton>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <InfoRow label="User ID" value={session.id} mono />
                <InfoRow label="Email" value={session.email} />
                <InfoRow label="Display Name" value={session.name ?? '—'} />
                <InfoRow label="Organization" value={userOrg?.name ?? session.orgId ?? 'Unknown'} />
              </div>
            )}
          </div>
        </DecoCard>

        {/* ---- Roles & Access Card ---- */}
        <DecoCard title="Roles & Access">
          <div className="space-y-5">
            <div>
              <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                Assigned Roles
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {session.roles.map((role) => (
                  <DecoBadge
                    key={role}
                    variant={
                      role === 'super-admin' ? 'amber' : role.includes('admin') ? 'purple' : 'teal'
                    }
                  >
                    {role}
                  </DecoBadge>
                ))}
              </div>
            </div>

            <DecoSeparator />

            <div className="space-y-3">
              <InfoRow label="Auth Provider" value="BetterAuth (Email)" />
              <InfoRow label="Auth Status" value="Authenticated" badge="green" />
              <InfoRow label="Account Created" value={formatDate('2025-11-15T00:00:00Z')} />
              <InfoRow label="Last Active" value={formatRelative(new Date().toISOString())} />
            </div>

            <DecoSeparator />

            <DecoButton variant="danger" onClick={signOut} className="w-full">
              Sign Out
            </DecoButton>
          </div>
        </DecoCard>

        {/* ---- Security Card ---- */}
        <DecoCard title="Security">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                  Password
                </span>
                <span className="mt-1 block text-[13px] text-deco-text-soft">
                  Last changed {formatRelative('2025-12-01T00:00:00Z')}
                </span>
              </div>
              {!isChangingPassword && (
                <DecoButton variant="ghost" onClick={() => setIsChangingPassword(true)}>
                  Change
                </DecoButton>
              )}
            </div>

            {isChangingPassword && (
              <>
                <DecoSeparator />
                <form
                  onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                  className="space-y-4"
                >
                  <DecoInput
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    {...passwordForm.register('currentPassword')}
                    error={passwordForm.formState.errors.currentPassword?.message}
                  />
                  <DecoInput
                    label="New Password"
                    type="password"
                    placeholder="Min 8 characters"
                    {...passwordForm.register('newPassword')}
                    error={passwordForm.formState.errors.newPassword?.message}
                  />
                  <DecoInput
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    {...passwordForm.register('confirmPassword')}
                    error={passwordForm.formState.errors.confirmPassword?.message}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <DecoButton
                      variant="ghost"
                      onClick={() => {
                        passwordForm.reset();
                        setIsChangingPassword(false);
                      }}
                    >
                      Cancel
                    </DecoButton>
                    <DecoButton type="submit" disabled={passwordForm.formState.isSubmitting}>
                      {passwordForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                    </DecoButton>
                  </div>
                </form>
              </>
            )}

            <DecoSeparator />

            <div>
              <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                Two-Factor Authentication
              </span>
              <div className="mt-2 flex items-center justify-between rounded border border-deco-border-dim bg-deco-bg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <DecoBadge variant="red" size="sm">
                    Disabled
                  </DecoBadge>
                  <span className="text-[12px] text-deco-text-dim">
                    Add an extra layer of security
                  </span>
                </div>
                <DecoButton variant="ghost" disabled>
                  Setup
                </DecoButton>
              </div>
            </div>
          </div>
        </DecoCard>

        {/* ---- Preferences Card ---- */}
        <DecoCard title="Preferences">
          <div className="space-y-5">
            <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
              Email Notifications
            </span>

            <ToggleRow
              label="Organization invitations"
              description="Receive emails when invited to an organization"
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />

            <ToggleRow
              label="Security alerts"
              description="Get notified about new sign-ins and suspicious activity"
              checked={securityAlerts}
              onChange={setSecurityAlerts}
            />

            <ToggleRow
              label="Weekly audit digest"
              description="Summary of organization activity sent every Monday"
              checked={auditDigest}
              onChange={setAuditDigest}
            />

            <DecoSeparator />

            <div>
              <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                Appearance
              </span>
              <div className="mt-2 rounded border border-deco-border-dim bg-deco-bg px-3 py-2.5 text-[12px] text-deco-text-dim">
                Theme is set to <span className="font-semibold text-deco-text">Dark</span> (system
                default). Light mode is not yet available.
              </div>
            </div>
          </div>
        </DecoCard>
      </div>

      {/* ---- Active Sessions (full-width) ---- */}
      <DecoCard title="Active Sessions">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
              {MOCK_SESSIONS.length} active {MOCK_SESSIONS.length === 1 ? 'session' : 'sessions'}
            </span>
            <DecoButton variant="ghost" onClick={() => decoToast.success('All other sessions revoked')}>
              Revoke All Others
            </DecoButton>
          </div>

          <DecoSeparator />

          {MOCK_SESSIONS.map((sess, idx) => {
            const { browser, os } = parseUserAgent(sess.userAgent);
            const isCurrent = idx === 0;
            return (
              <div
                key={sess.id}
                className={`flex items-center gap-4 rounded border px-4 py-3 transition-colors ${
                  isCurrent
                    ? 'border-deco-amber/30 bg-deco-amber/5'
                    : 'border-deco-border-dim bg-deco-bg'
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-deco-surface text-lg text-deco-text-copper">
                  {DEVICE_ICONS[os] ?? DEVICE_ICONS.Unknown}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-deco-text">
                      {browser} on {os}
                    </span>
                    {isCurrent && (
                      <DecoBadge variant="green" size="sm">
                        Current
                      </DecoBadge>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 font-mono text-[11px] text-deco-text-dim">
                    <span>{sess.ipAddress}</span>
                    <span className="text-deco-border">·</span>
                    <span>Started {formatRelative(sess.createdAt)}</span>
                    <span className="text-deco-border">·</span>
                    <span>Expires {formatRelative(sess.expiresAt)}</span>
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => setRevokeSession(sess)}
                    className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-dim hover:bg-deco-red/10 hover:text-deco-red transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </DecoCard>

      {/* Revoke confirm */}
      <ConfirmDialog
        open={!!revokeSession}
        onClose={() => setRevokeSession(null)}
        onConfirm={handleRevokeSession}
        title="Revoke Session"
        message={`Revoke the session from ${parseUserAgent(revokeSession?.userAgent ?? null).browser} on ${parseUserAgent(revokeSession?.userAgent ?? null).os}? The device will be signed out immediately.`}
        confirmLabel="Revoke"
      />
    </div>
  );
}

// --- Sub-components ---

function InfoRow({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: 'green' | 'red' | 'amber';
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
        {label}
      </span>
      {badge ? (
        <DecoBadge variant={badge}>{value}</DecoBadge>
      ) : (
        <span className={`text-[13px] text-deco-text-soft ${mono ? 'font-mono text-[11px]' : ''}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="text-[13px] font-semibold text-deco-text">{label}</span>
        <span className="mt-0.5 block text-[12px] text-deco-text-dim">{description}</span>
      </div>
      <DecoToggle checked={checked} onChange={onChange} />
    </div>
  );
}
