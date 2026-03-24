import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DecoButton,
  DecoBadge,
  DecoModal,
  DecoTable,
  DecoInput,
  DecoSelect,
  decoToast,
} from '@components/primitives';
import type { DecoColumnDef } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import {
  useInvites,
  useCreateInvite,
  useRevokeInvite,
} from '@api/hooks/useInvites';
import type { CreateInvitePayload } from '@api/hooks/useInvites';
import { useApplications } from '@api/hooks/useApplications';
import { useActiveOrg } from '@/context/OrgContext';
import { useSession } from '@auth/hooks/useSession';
import { formatDate } from '@lib/format';
import { extractApiError } from '@lib/errors';
import type { Invite, InviteStatus } from '@/types/models';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'REVOKED', label: 'Revoked' },
];

const STATUS_BADGE_VARIANT: Record<InviteStatus, 'amber' | 'green' | 'muted' | 'red'> = {
  PENDING: 'amber',
  ACCEPTED: 'green',
  EXPIRED: 'muted',
  REVOKED: 'red',
};

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

function getEffectiveStatus(invite: Invite): InviteStatus {
  if (invite.status === 'PENDING' && new Date(invite.expiresAt) < new Date()) {
    return 'EXPIRED';
  }
  return invite.status;
}

// ─── Invite Org Member Modal ──────────────────────────────────────────────────

const orgInviteSchema = z
  .object({
    email: z.string().email('Valid email required'),
    role: z.enum(['admin', 'member']),
    appId: z.string().optional(),
  })
  .refine((d) => d.role !== 'member' || !!d.appId, {
    message: 'Select an application for member invites',
    path: ['appId'],
  });

type OrgInviteForm = z.infer<typeof orgInviteSchema>;

function InviteOrgMemberModal({
  open,
  onClose,
  orgId,
  orgName,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  onCreated: (invite: Invite) => void;
}) {
  const createMutation = useCreateInvite();
  const { data: appsData } = useApplications(orgId);
  const apps = appsData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<OrgInviteForm>({
    resolver: zodResolver(orgInviteSchema),
    defaultValues: { email: '', role: 'member', appId: '' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: OrgInviteForm) => {
    const payload: CreateInvitePayload = {
      email: data.email,
      orgId,
      orgRole: data.role,
      appId: data.role === 'member' ? data.appId : undefined,
    };
    try {
      const invite = await createMutation.mutateAsync(payload);
      decoToast.success(`Invite sent to ${data.email}`);
      reset();
      onCreated(invite);
    } catch (err) {
      const msg = await extractApiError(err, 'Failed to create invite');
      decoToast.error(msg);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <DecoModal
      open={open}
      onClose={handleClose}
      title="Invite Org Member"
      footer={
        <>
          <DecoButton variant="ghost" onClick={handleClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Sending...' : 'Send Invite'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Read-only org */}
        <div className="space-y-1">
          <label className="font-mono text-[11px] uppercase tracking-deco-wide text-deco-text-dim">
            Organization
          </label>
          <div className="rounded border border-deco-border bg-deco-bg px-3 py-2 font-mono text-xs text-deco-amber">
            {orgName}
          </div>
        </div>

        <DecoInput
          label="Email Address"
          placeholder="user@example.com"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />

        <DecoSelect label="Role" {...register('role')} error={errors.role?.message}>
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </DecoSelect>

        {selectedRole === 'member' && (
          <DecoSelect
            label="Application"
            {...register('appId')}
            error={errors.appId?.message}
          >
            <option value="">Select an application…</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </DecoSelect>
        )}

        <div className="rounded border border-deco-border-dim bg-deco-bg px-3 py-2.5 font-mono text-[11px] text-deco-text-dim">
          {selectedRole === 'member'
            ? 'Member can only access the selected application.'
            : 'Admin can access all applications within the organization.'}
        </div>
      </form>
    </DecoModal>
  );
}

// ─── Invite Heimdal Admin Modal ───────────────────────────────────────────────

function InviteAdminModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (invite: Invite) => void;
}) {
  const createMutation = useCreateInvite();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError(null);
    try {
      const invite = await createMutation.mutateAsync({ email });
      decoToast.success('Heimdal Admin invite created');
      setEmail('');
      onCreated(invite);
    } catch (err) {
      const msg = await extractApiError(err, 'Failed to create invite');
      decoToast.error(msg);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailError(null);
    onClose();
  };

  return (
    <DecoModal
      open={open}
      onClose={handleClose}
      title="Invite Heimdal Admin"
      footer={
        <>
          <DecoButton variant="ghost" onClick={handleClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Generate Code'}
          </DecoButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded border border-deco-amber/20 bg-deco-amber/6 px-3 py-2.5 font-mono text-[11px] text-deco-amber">
          This invite grants full platform-admin access to Heimdal. Use with care.
        </div>
        <DecoInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          placeholder="newadmin@example.com"
          error={emailError ?? undefined}
          hint="The invited user must sign up with this exact address."
        />
      </div>
    </DecoModal>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────

function InviteSuccessModal({
  invite,
  onClose,
}: {
  invite: Invite | null;
  onClose: () => void;
}) {
  const handleCopyCode = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.code);
    decoToast.success('Code copied');
  };

  const handleCopyUrl = async () => {
    if (!invite) return;
    const url = `${window.location.origin}/signup?code=${invite.code}`;
    await navigator.clipboard.writeText(url);
    decoToast.success('URL copied');
  };

  return (
    <DecoModal
      open={!!invite}
      onClose={onClose}
      title="Invite Created"
      footer={<DecoButton onClick={onClose}>Done</DecoButton>}
    >
      {invite && (
        <div className="space-y-4">
          <p className="font-mono text-xs text-deco-text-dim">
            Share this code with <span className="text-deco-amber">{invite.email}</span>.
            Expires in 48 hours.
          </p>

          <div className="rounded border border-deco-amber/30 bg-deco-amber/8 p-4 text-center">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-deco-wide text-deco-copper">
              Invite Code
            </p>
            <p className="font-mono text-2xl font-bold tracking-deco-wider text-deco-amber">
              {invite.code}
            </p>
            <button
              onClick={handleCopyCode}
              className="mt-2 font-mono text-[10px] text-deco-copper transition-colors hover:text-deco-amber"
            >
              Copy code
            </button>
          </div>

          <div className="rounded border border-deco-border bg-deco-bg p-3">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-deco-wide text-deco-copper">
              Signup URL
            </p>
            <p className="break-all font-mono text-[11px] text-deco-text-dim">
              {window.location.origin}/signup?code={invite.code}
            </p>
            <button
              onClick={handleCopyUrl}
              className="mt-1.5 font-mono text-[10px] text-deco-copper transition-colors hover:text-deco-amber"
            >
              Copy URL
            </button>
          </div>
        </div>
      )}
    </DecoModal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Invites() {
  const { activeOrg } = useActiveOrg();
  const { isPlatformAdmin } = useSession();

  const [statusFilter, setStatusFilter] = useState('all');
  const [orgInviteOpen, setOrgInviteOpen] = useState(false);
  const [adminInviteOpen, setAdminInviteOpen] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Invite | null>(null);

  const { data: invites, isLoading } = useInvites(activeOrg?.id);
  const revokeMutation = useRevokeInvite();

  const filtered = useMemo(() => {
    if (!invites) return [];
    if (statusFilter === 'all') return invites;
    return invites.filter((inv) => getEffectiveStatus(inv) === statusFilter);
  }, [invites, statusFilter]);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation.mutateAsync(revokeTarget.id);
      decoToast.success(`Invite for ${revokeTarget.email} revoked`);
      setRevokeTarget(null);
    } catch {
      decoToast.error('Failed to revoke invite');
    }
  };

  const columns: DecoColumnDef<Invite>[] = [
    {
      key: 'email',
      header: 'Email',
      cell: (row) => <span className="font-mono text-xs">{row.email}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row) => (
        <DecoBadge variant={row.orgId ? 'teal' : 'purple'}>
          {row.orgId ? 'org member' : 'heimdal admin'}
        </DecoBadge>
      ),
    },
    {
      key: 'orgRole',
      header: 'Role',
      cell: (row) =>
        row.orgId ? (
          <span className="font-mono text-[11px] capitalize text-deco-text-soft">
            {row.orgRole}
          </span>
        ) : (
          <span className="text-[11px] text-deco-text-dim">—</span>
        ),
    },
    {
      key: 'app',
      header: 'App',
      cell: (row) =>
        row.app ? (
          <span className="font-mono text-[11px] text-deco-text-soft">{row.app.name}</span>
        ) : (
          <span className="text-[11px] text-deco-text-dim">—</span>
        ),
    },
    {
      key: 'code',
      header: 'Code',
      cell: (row) => {
        const status = getEffectiveStatus(row);
        return status === 'PENDING' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(row.code);
              decoToast.success('Code copied');
            }}
            className="cursor-pointer font-mono text-xs text-deco-amber hover:underline"
            title="Click to copy"
          >
            {row.code}
          </button>
        ) : (
          <span className="font-mono text-xs text-deco-text-dim">{row.code}</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const status = getEffectiveStatus(row);
        return <DecoBadge variant={STATUS_BADGE_VARIANT[status]}>{status}</DecoBadge>;
      },
    },
    {
      key: 'createdBy',
      header: 'Created By',
      cell: (row) => (
        <span className="text-xs text-deco-text-dim">
          {row.invitedBy?.name ?? row.invitedBy?.email ?? '—'}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      cell: (row) => (
        <span className="font-mono text-[11px] text-deco-text-dim">{formatDate(row.expiresAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => {
        const status = getEffectiveStatus(row);
        if (status !== 'PENDING') return null;
        return (
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const url = `${window.location.origin}/signup?code=${row.code}`;
                navigator.clipboard.writeText(url);
                decoToast.success('URL copied');
              }}
              className="font-mono text-[10px] text-deco-copper transition-colors hover:text-deco-amber"
              title="Copy signup URL"
            >
              URL
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevokeTarget(row);
              }}
              className="font-mono text-[10px] text-deco-red transition-opacity hover:opacity-80"
            >
              Revoke
            </button>
          </div>
        );
      },
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-deco-spin rounded-full border-2 border-deco-amber border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invites"
        subtitle={
          activeOrg
            ? `Pending and past invites for ${activeOrg.name}`
            : 'Select an organization to view its invites'
        }
        action={
          <div className="flex gap-2">
            {activeOrg && (
              <DecoButton onClick={() => setOrgInviteOpen(true)}>
                + Invite Org Member
              </DecoButton>
            )}
            {isPlatformAdmin && (
              <DecoButton variant="ghost" onClick={() => setAdminInviteOpen(true)}>
                + Invite Heimdal Admin
              </DecoButton>
            )}
          </div>
        }
      />

      {/* Status filter */}
      <div className="flex items-center gap-2">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded border px-3 py-1.5 font-mono text-[10px] uppercase tracking-deco-wide transition-colors ${
              statusFilter === opt.value
                ? 'border-deco-copper/40 bg-deco-amber/12 text-deco-amber'
                : 'border-deco-border bg-transparent text-deco-text-dim hover:text-deco-text'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!activeOrg ? (
        <EmptyState
          title="No organization selected"
          message="Select an organization from the header to view its invites."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No invites"
          message={
            statusFilter === 'all'
              ? 'No invites yet. Use the buttons above to invite members or admins.'
              : `No invites with status "${statusFilter}".`
          }
        />
      ) : (
        <DecoTable columns={columns} data={filtered} rowKey={(row) => row.id} />
      )}

      {/* Org member invite modal */}
      {activeOrg && (
        <InviteOrgMemberModal
          open={orgInviteOpen}
          onClose={() => setOrgInviteOpen(false)}
          orgId={activeOrg.id}
          orgName={activeOrg.name}
          onCreated={(invite) => {
            setOrgInviteOpen(false);
            setCreatedInvite(invite);
          }}
        />
      )}

      {/* Heimdal Admin invite modal */}
      <InviteAdminModal
        open={adminInviteOpen}
        onClose={() => setAdminInviteOpen(false)}
        onCreated={(invite) => {
          setAdminInviteOpen(false);
          setCreatedInvite(invite);
        }}
      />

      {/* Success modal */}
      <InviteSuccessModal invite={createdInvite} onClose={() => setCreatedInvite(null)} />

      {/* Revoke confirmation */}
      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke Invite"
        message={`Are you sure you want to revoke the invite for ${revokeTarget?.email}? This cannot be undone.`}
        isLoading={revokeMutation.isPending}
      />
    </div>
  );
}
