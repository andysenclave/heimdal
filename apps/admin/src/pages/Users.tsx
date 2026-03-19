import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DecoButton,
  DecoInput,
  DecoSelect,
  DecoTable,
  DecoBadge,
  DecoModal,
  DecoAvatar,
  decoToast,
} from '@components/primitives';
import type { DecoColumnDef } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import {
  useMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useTransferOwnership,
} from '@api/hooks/useUsers';
import type { InviteMemberPayload, UpdateMemberPayload } from '@api/hooks/useUsers';
import { useActiveOrg } from '@/context/OrgContext';
import { formatDate } from '@lib/format';
import { extractApiError } from '@lib/errors';
import { useDebounce } from '@hooks/useDebounce';
import type { OrgMembership } from '@/types/models';

// --- Schemas ---

const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['admin', 'member']),
});

type InviteForm = z.infer<typeof inviteSchema>;

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

const ROLE_BADGE_VARIANT = {
  owner: 'amber',
  admin: 'purple',
  member: 'teal',
} as const;

// --- Invite Modal ---

function InviteMemberModal({
  open,
  onClose,
  orgId,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
}) {
  const invite = useInviteMember();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'member' },
  });

  const onSubmit = async (data: InviteForm) => {
    const payload: InviteMemberPayload = {
      email: data.email,
      role: data.role,
      orgId,
    };
    try {
      await invite.mutateAsync(payload);
      decoToast.success(`Invitation sent to ${data.email}`);
      reset();
      onClose();
    } catch (err: unknown) {
      const message = await extractApiError(err, 'Failed to send invitation');
      decoToast.error(message);
    }
  };

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title="Invite Member"
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={invite.isPending}>
            {invite.isPending ? 'Sending...' : 'Send Invite'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <div className="rounded border border-deco-border-dim bg-deco-bg px-3 py-2.5 text-[12px] text-deco-text-dim">
          The user will receive an email invitation to join the organization.
        </div>
      </form>
    </DecoModal>
  );
}

// --- Change Role Modal ---

function ChangeRoleModal({
  open,
  onClose,
  member,
}: {
  open: boolean;
  onClose: () => void;
  member: OrgMembership;
}) {
  const updateRole = useUpdateMemberRole();
  const transferOwnership = useTransferOwnership();
  const [selectedRole, setSelectedRole] = useState<UpdateMemberPayload['role']>(member.role);
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  const isPending = updateRole.isPending || transferOwnership.isPending;

  const handleSave = async () => {
    if (selectedRole === 'owner') {
      // Show confirmation step
      setConfirmTransfer(true);
      return;
    }
    try {
      await updateRole.mutateAsync({
        orgId: member.orgId,
        userId: member.userId,
        role: selectedRole,
      });
      decoToast.success('Role updated');
      onClose();
    } catch {
      decoToast.error('Failed to update role');
    }
  };

  const handleConfirmTransfer = async () => {
    try {
      await transferOwnership.mutateAsync({
        orgId: member.orgId,
        toUserId: member.userId,
      });
      decoToast.success(`Ownership transferred to ${member.user.name ?? member.user.email}`);
      setConfirmTransfer(false);
      onClose();
    } catch {
      decoToast.error('Failed to transfer ownership');
    }
  };

  // Confirmation view
  if (confirmTransfer) {
    return (
      <DecoModal
        open={open}
        onClose={() => { setConfirmTransfer(false); onClose(); }}
        title="Transfer Ownership"
        footer={
          <>
            <DecoButton variant="ghost" onClick={() => setConfirmTransfer(false)}>
              Cancel
            </DecoButton>
            <DecoButton
              variant="primary"
              onClick={handleConfirmTransfer}
              disabled={transferOwnership.isPending}
            >
              {transferOwnership.isPending ? 'Transferring...' : 'Transfer Ownership'}
            </DecoButton>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded border border-deco-amber/30 bg-deco-amber/8 px-3 py-3">
            <p className="text-[13px] font-semibold text-deco-amber">⚠ Transfer Ownership</p>
            <p className="mt-1 text-[12px] text-deco-text-soft">
              Transfer ownership of this organization to{' '}
              <span className="font-semibold">{member.user.name ?? member.user.email}</span>?
            </p>
            <p className="mt-1 text-[12px] text-deco-text-dim">
              You will be demoted to Admin. This cannot be undone without another transfer.
            </p>
          </div>
        </div>
      </DecoModal>
    );
  }

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title="Change Member Role"
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton
            onClick={handleSave}
            disabled={isPending || selectedRole === member.role}
            variant={selectedRole === 'owner' ? 'primary' : 'primary'}
          >
            {isPending
              ? 'Saving...'
              : selectedRole === 'owner'
              ? 'Transfer Ownership...'
              : 'Save'}
          </DecoButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded border border-deco-border-dim bg-deco-bg px-3 py-3">
          <DecoAvatar name={member.user.name ?? member.user.email} size="sm" />
          <div>
            <div className="text-[13px] font-semibold text-deco-text">
              {member.user.name ?? member.user.email.split('@')[0]}
            </div>
            <div className="font-mono text-[11px] text-deco-text-dim">{member.user.email}</div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
            Role
          </label>
          {(['owner', 'admin', 'member'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`flex w-full items-center justify-between rounded border px-3 py-2.5 text-left transition-colors ${
                selectedRole === role
                  ? 'border-deco-amber/40 bg-deco-amber/8 text-deco-text'
                  : 'border-deco-border bg-transparent text-deco-text-soft hover:border-deco-border-dim'
              }`}
            >
              <div>
                <span className="text-[13px] font-semibold capitalize">{role}</span>
                {role === 'owner' && (
                  <span className="ml-2 font-mono text-[10px] text-deco-amber">
                    (requires transfer)
                  </span>
                )}
              </div>
              <DecoBadge variant={ROLE_BADGE_VARIANT[role]} size="sm">{role}</DecoBadge>
            </button>
          ))}
        </div>
      </div>
    </DecoModal>
  );
}

// --- Page ---

export default function Users() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [changeRoleMember, setChangeRoleMember] = useState<OrgMembership | null>(null);
  const [removeMember, setRemoveMember] = useState<OrgMembership | null>(null);

  const { activeOrg } = useActiveOrg();
  const debouncedSearch = useDebounce(search, 250);
  const { data, isLoading } = useMembers(activeOrg?.id ?? '');
  const removeMemberMutation = useRemoveMember();

  const members = data?.data ?? [];

  const filtered = useMemo(() => {
    let result = members;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (m) =>
          m.user.email.toLowerCase().includes(q) ||
          (m.user.name && m.user.name.toLowerCase().includes(q)),
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter((m) => m.role === roleFilter);
    }
    return result;
  }, [members, debouncedSearch, roleFilter]);

  const handleRemove = async () => {
    if (!removeMember) return;
    try {
      await removeMemberMutation.mutateAsync({
        orgId: removeMember.orgId,
        userId: removeMember.userId,
      });
      decoToast.success('Member removed');
      setRemoveMember(null);
    } catch {
      decoToast.error('Failed to remove member');
    }
  };

  const columns: DecoColumnDef<OrgMembership>[] = [
    {
      key: 'user',
      header: 'Member',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <DecoAvatar name={row.user.name ?? row.user.email} size="sm" />
          <div>
            <div className="text-[13px] font-semibold text-deco-text">
              {row.user.name ?? row.user.email.split('@')[0]}
            </div>
            <div className="font-mono text-[11px] text-deco-text-dim">{row.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (row) => (
        <DecoBadge variant={ROLE_BADGE_VARIANT[row.role]}>
          {row.role}
        </DecoBadge>
      ),
      className: 'w-[100px]',
    },
    {
      key: 'verified',
      header: 'Verified',
      cell: (row) => (
        <DecoBadge variant={row.user.emailVerified ? 'green' : 'red'} size="sm">
          {row.user.emailVerified ? 'Verified' : 'Pending'}
        </DecoBadge>
      ),
      className: 'w-[100px]',
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (row) => (
        <span className="font-mono text-[11px] text-deco-text-soft">
          {formatDate(row.createdAt)}
        </span>
      ),
      className: 'w-[120px]',
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setChangeRoleMember(row);
            }}
            className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-soft hover:bg-deco-surface-hover hover:text-deco-amber transition-colors"
          >
            Role
          </button>
          {row.role !== 'owner' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRemoveMember(row);
              }}
              className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-dim hover:bg-deco-red/10 hover:text-deco-red transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      ),
      className: 'w-[140px]',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 rounded-full border-2 border-deco-amber border-t-transparent animate-deco-spin" />
      </div>
    );
  }

  if (!activeOrg) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Users"
          subtitle="Organization members"
          action={
            <DecoButton disabled>
              + Invite Member
            </DecoButton>
          }
        />
        <EmptyState
          icon="⊕"
          title="Select an organization"
          message="Choose an organization from the header to view its members"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        subtitle={`Organization members · ${members.length} total`}
        action={
          <DecoButton onClick={() => setInviteOpen(true)}>
            + Invite Member
          </DecoButton>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-deco-text-dim text-sm">
            ⌕
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-deco-border bg-deco-bg py-2 pl-8 pr-3 text-[13px] text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {ROLE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={`rounded border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                roleFilter === opt.value
                  ? 'border-deco-amber/40 bg-deco-amber/10 text-deco-amber'
                  : 'border-deco-border bg-transparent text-deco-text-dim hover:text-deco-text-soft'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[11px] text-deco-text-dim">
          {filtered.length} of {members.length} members
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="⊕"
          title={search ? 'No results' : 'No members'}
          message={
            search
              ? `No members match "${search}"`
              : 'Invite your first team member to get started'
          }
        />
      ) : (
        <DecoTable
          columns={columns}
          data={filtered}
          rowKey={(row) => row.userId}
        />
      )}

      {/* Modals */}
      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        orgId={activeOrg?.id ?? ''}
      />

      {changeRoleMember && (
        <ChangeRoleModal
          open={!!changeRoleMember}
          onClose={() => setChangeRoleMember(null)}
          member={changeRoleMember}
        />
      )}

      <ConfirmDialog
        open={!!removeMember}
        onClose={() => setRemoveMember(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        message={`Remove ${removeMember?.user.name ?? removeMember?.user.email} from the organization? They will lose access immediately.`}
        confirmLabel="Remove"
        isLoading={removeMemberMutation.isPending}
      />
    </div>
  );
}
