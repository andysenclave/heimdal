import { useState, useMemo } from 'react';
import { DecoButton, DecoBadge, DecoModal, DecoTable, DecoInput, decoToast } from '@components/primitives';
import type { DecoColumnDef } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { useInvites, useCreateInvite, useRevokeInvite } from '@api/hooks/useInvites';
import type { Invite, InviteStatus } from '@/types/models';

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

function getEffectiveStatus(invite: Invite): InviteStatus {
  if (invite.status === 'PENDING' && new Date(invite.expiresAt) < new Date()) {
    return 'EXPIRED';
  }
  return invite.status;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Invites() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null);
  const [revokeInvite, setRevokeInvite] = useState<Invite | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const { data: invites, isLoading } = useInvites();
  const createMutation = useCreateInvite();
  const revokeMutation = useRevokeInvite();

  const filtered = useMemo(() => {
    if (!invites) return [];
    if (statusFilter === 'all') return invites;
    return invites.filter((inv) => getEffectiveStatus(inv) === statusFilter);
  }, [invites, statusFilter]);

  const handleCreate = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError(null);
    try {
      const invite = await createMutation.mutateAsync(newEmail);
      setCreatedInvite(invite);
      setCreateOpen(false);
      setNewEmail('');
      decoToast.success('Invite created');
    } catch {
      decoToast.error('Failed to create invite. A pending invite may already exist for this email.');
    }
  };

  const handleRevoke = async () => {
    if (!revokeInvite) return;
    try {
      await revokeMutation.mutateAsync(revokeInvite.id);
      decoToast.success(`Invite for ${revokeInvite.email} revoked`);
      setRevokeInvite(null);
    } catch {
      decoToast.error('Failed to revoke invite');
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    decoToast.success('Code copied to clipboard');
  };

  const handleCopyUrl = async (code: string) => {
    const url = `${window.location.origin}/signup?code=${code}`;
    await navigator.clipboard.writeText(url);
    decoToast.success('Signup URL copied to clipboard');
  };

  const columns: DecoColumnDef<Invite>[] = [
    {
      key: 'email',
      header: 'Email',
      cell: (row) => <span className="font-mono text-xs">{row.email}</span>,
    },
    {
      key: 'code',
      header: 'Code',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopyCode(row.code);
          }}
          className="font-mono text-xs text-deco-amber hover:underline cursor-pointer"
          title="Click to copy"
        >
          {row.code}
        </button>
      ),
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
      key: 'createdAt',
      header: 'Created',
      cell: (row) => (
        <span className="font-mono text-[11px] text-deco-text-dim">{formatDate(row.createdAt)}</span>
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
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyUrl(row.code);
              }}
              className="font-mono text-[10px] text-deco-copper hover:text-deco-amber transition-colors"
              title="Copy signup URL"
            >
              URL
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevokeInvite(row);
              }}
              className="font-mono text-[10px] text-deco-red hover:opacity-80 transition-opacity"
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
        <div className="h-6 w-6 rounded-full border-2 border-deco-amber border-t-transparent animate-deco-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invites"
        subtitle="Generate invite codes to onboard new Heimdal Admins"
        action={
          <DecoButton onClick={() => setCreateOpen(true)}>+ Create Invite</DecoButton>
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

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No invites"
          message={
            statusFilter === 'all'
              ? 'Create your first invite to onboard a new admin.'
              : `No invites with status "${statusFilter}".`
          }
        />
      ) : (
        <DecoTable columns={columns} data={filtered} rowKey={(row) => row.id} />
      )}

      {/* Create invite modal */}
      <DecoModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewEmail('');
          setEmailError(null);
        }}
        title="Create Invite"
        footer={
          <>
            <DecoButton
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                setNewEmail('');
                setEmailError(null);
              }}
            >
              Cancel
            </DecoButton>
            <DecoButton onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Generate Code'}
            </DecoButton>
          </>
        }
      >
        <DecoInput
          label="Email Address"
          type="email"
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            setEmailError(null);
          }}
          placeholder="newadmin@example.com"
          error={emailError ?? undefined}
          hint="The invite will be tied to this email. The invited user must sign up with this exact address."
        />
      </DecoModal>

      {/* Created invite success modal */}
      <DecoModal
        open={!!createdInvite}
        onClose={() => setCreatedInvite(null)}
        title="Invite Created"
        footer={
          <DecoButton onClick={() => setCreatedInvite(null)}>Done</DecoButton>
        }
      >
        {createdInvite && (
          <div className="space-y-4">
            <p className="font-mono text-xs text-deco-text-dim">
              Share this code with <span className="text-deco-amber">{createdInvite.email}</span>.
              It expires in 48 hours.
            </p>

            {/* Code display */}
            <div className="rounded border border-deco-amber/30 bg-deco-amber/8 p-4 text-center">
              <p className="font-mono text-[10px] uppercase tracking-deco-wide text-deco-copper mb-2">
                Invite Code
              </p>
              <p className="font-mono text-2xl font-bold tracking-deco-wider text-deco-amber">
                {createdInvite.code}
              </p>
              <button
                onClick={() => handleCopyCode(createdInvite.code)}
                className="mt-2 font-mono text-[10px] text-deco-copper hover:text-deco-amber transition-colors"
              >
                Copy code
              </button>
            </div>

            {/* URL display */}
            <div className="rounded border border-deco-border bg-deco-bg p-3">
              <p className="font-mono text-[10px] uppercase tracking-deco-wide text-deco-copper mb-1.5">
                Signup URL
              </p>
              <p className="break-all font-mono text-[11px] text-deco-text-dim">
                {window.location.origin}/signup?code={createdInvite.code}
              </p>
              <button
                onClick={() => handleCopyUrl(createdInvite.code)}
                className="mt-1.5 font-mono text-[10px] text-deco-copper hover:text-deco-amber transition-colors"
              >
                Copy URL
              </button>
            </div>
          </div>
        )}
      </DecoModal>

      {/* Revoke confirmation */}
      <ConfirmDialog
        open={!!revokeInvite}
        onClose={() => setRevokeInvite(null)}
        onConfirm={handleRevoke}
        title="Revoke Invite"
        message={`Are you sure you want to revoke the invite for ${revokeInvite?.email}? This cannot be undone.`}
        isLoading={revokeMutation.isPending}
      />
    </div>
  );
}
