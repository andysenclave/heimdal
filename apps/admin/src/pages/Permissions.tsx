import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DecoButton,
  DecoInput,
  DecoTable,
  DecoBadge,
  DecoModal,
  DecoTextarea,
  DecoSelect,
  decoToast,
} from '@components/primitives';
import type { DecoColumnDef } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import {
  usePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
} from '@api/hooks/usePermissions';
import type { CreatePermPayload, UpdatePermPayload } from '@api/hooks/usePermissions';
import { useApplications } from '@api/hooks/useApplications';
import { useActiveOrg } from '@/context/OrgContext';
import { useActiveApp } from '@/context/AppContext';
import { useFeatureAccess } from '@auth/hooks/useRoleGate';
import { AppSelector } from '@components/sections';
import { formatDate } from '@lib/format';
import { useDebounce } from '@hooks/useDebounce';
import type { Permission } from '@/types/models';

// --- Schemas ---

const PERM_PATTERN = /^[a-z]+:[a-z]+$/;

const createPermSchema = z.object({
  domain: z.string().min(1, 'Domain is required').regex(/^[a-z]+$/, 'Lowercase letters only'),
  action: z.string().min(1, 'Action is required').regex(/^[a-z]+$/, 'Lowercase letters only'),
  appId: z.string().min(1, 'Application is required'),
  description: z.string().optional(),
});

const editPermSchema = z.object({
  description: z.string().optional(),
});

type CreatePermForm = z.infer<typeof createPermSchema>;
type EditPermForm = z.infer<typeof editPermSchema>;

// --- Helpers ---

function splitKey(key: string): { domain: string; action: string } {
  const [domain, action] = key.split(':');
  return { domain: domain ?? '', action: action ?? '' };
}

function uniqueDomains(permissions: Permission[]): string[] {
  const set = new Set(permissions.map((p) => splitKey(p.key).domain));
  return Array.from(set).sort();
}

// --- Create Modal ---

function CreatePermModal({
  open,
  onClose,
  orgId,
  prefilledAppId,
  prefilledAppName,
}: {
  open: boolean;
  onClose: () => void;
  orgId: string;
  prefilledAppId?: string;
  prefilledAppName?: string;
}) {
  const createPerm = useCreatePermission();
  const { data: appsData } = useApplications(orgId);
  const apps = appsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreatePermForm>({
    resolver: zodResolver(createPermSchema),
    defaultValues: { domain: '', action: '', appId: prefilledAppId ?? '', description: '' },
  });

  const domain = watch('domain');
  const action = watch('action');

  const onSubmit = async (data: CreatePermForm) => {
    const payload: CreatePermPayload = {
      key: `${data.domain}:${data.action}`,
      description: data.description || null,
      orgId,
      appId: prefilledAppId ?? data.appId,
    };
    try {
      await createPerm.mutateAsync(payload);
      decoToast.success('Permission created');
      reset();
      onClose();
    } catch {
      decoToast.error('Failed to create permission');
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <DecoModal
      open={open}
      onClose={handleClose}
      title="Create Permission"
      footer={
        <>
          <DecoButton variant="ghost" onClick={handleClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={createPerm.isPending}>
            {createPerm.isPending ? 'Creating...' : 'Create'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <DecoInput
            label="Domain"
            placeholder="portfolio"
            mono
            {...register('domain')}
            error={errors.domain?.message}
          />
          <DecoInput
            label="Action"
            placeholder="read"
            mono
            {...register('action')}
            error={errors.action?.message}
          />
        </div>
        <div className="rounded border border-deco-border-dim bg-deco-bg px-3 py-2">
          <span className="font-mono text-[10px] text-deco-text-copper">PREVIEW</span>
          <span className="ml-2 font-mono text-sm font-bold text-deco-amber">
            {domain || '•••'}:{action || '•••'}
          </span>
        </div>

        {/* App — read-only when pre-filled, dropdown otherwise */}
        {prefilledAppId ? (
          <div className="space-y-1">
            <label className="font-mono text-[11px] uppercase tracking-deco-wide text-deco-text-dim">
              Application
            </label>
            <div className="rounded border border-deco-border bg-deco-bg px-3 py-2 font-mono text-xs text-deco-teal">
              {prefilledAppName ?? prefilledAppId}
            </div>
          </div>
        ) : (
          <DecoSelect
            label="Application"
            {...register('appId')}
            error={errors.appId?.message}
          >
            <option value="">Select application...</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </DecoSelect>
        )}

        <DecoTextarea
          label="Description"
          placeholder="What does this permission grant?"
          {...register('description')}
          error={errors.description?.message}
        />
      </form>
    </DecoModal>
  );
}

// --- Edit Modal ---

function EditPermModal({
  open,
  onClose,
  perm,
}: {
  open: boolean;
  onClose: () => void;
  perm: Permission;
}) {
  const updatePerm = useUpdatePermission();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditPermForm>({
    resolver: zodResolver(editPermSchema),
    defaultValues: { description: perm.description || '' },
  });

  const onSubmit = async (data: EditPermForm) => {
    const payload: UpdatePermPayload & { id: string } = {
      id: perm.id,
      description: data.description || null,
    };
    try {
      await updatePerm.mutateAsync(payload);
      decoToast.success('Permission updated');
      onClose();
    } catch {
      decoToast.error('Failed to update permission');
    }
  };

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title="Edit Permission"
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={updatePerm.isPending}>
            {updatePerm.isPending ? 'Saving...' : 'Save Changes'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded border border-deco-border-dim bg-deco-bg px-3 py-2.5">
          <span className="block font-mono text-[10px] text-deco-text-copper">PERMISSION KEY</span>
          <span className="font-mono text-sm font-bold text-deco-amber">{perm.key}</span>
        </div>
        <DecoTextarea
          label="Description"
          placeholder="What does this permission grant?"
          {...register('description')}
          error={errors.description?.message}
        />
      </form>
    </DecoModal>
  );
}

// --- Page ---

export default function Permissions() {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editPerm, setEditPerm] = useState<Permission | null>(null);
  const [deletePerm, setDeletePerm] = useState<Permission | null>(null);

  const { activeOrg } = useActiveOrg();
  const { activeApp } = useActiveApp();
  const { canWritePermissions, canDeletePermissions } = useFeatureAccess();
  const debouncedSearch = useDebounce(search, 250);
  const { data, isLoading } = usePermissions(activeApp?.id, activeOrg?.id);
  const deletePermMutation = useDeletePermission();

  const permissions = data?.data ?? [];
  const domains = useMemo(() => uniqueDomains(permissions), [permissions]);

  const filtered = useMemo(() => {
    let result = permissions;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.key.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }
    if (domainFilter !== 'all') {
      result = result.filter((p) => splitKey(p.key).domain === domainFilter);
    }
    return result;
  }, [permissions, debouncedSearch, domainFilter]);

  const handleDelete = async () => {
    if (!deletePerm) return;
    try {
      await deletePermMutation.mutateAsync(deletePerm.id);
      decoToast.success(`"${deletePerm.key}" deleted`);
      setDeletePerm(null);
    } catch {
      decoToast.error('Failed to delete permission');
    }
  };

  const columns: DecoColumnDef<Permission>[] = [
    {
      key: 'key',
      header: 'Permission Key',
      cell: (row) => {
        const { domain, action } = splitKey(row.key);
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-bold text-deco-amber">{domain}</span>
            <span className="text-deco-text-dim">:</span>
            <span className="font-mono text-sm font-bold text-deco-teal">{action}</span>
          </div>
        );
      },
      sortable: true,
      sortValue: (row) => row.key,
    },
    {
      key: 'domain',
      header: 'Domain',
      cell: (row) => (
        <DecoBadge variant="amber" size="sm">
          {splitKey(row.key).domain}
        </DecoBadge>
      ),
      className: 'w-[100px]',
    },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => (
        <span className="text-[12px] text-deco-text-soft">
          {row.description || <span className="italic text-deco-text-dim">No description</span>}
        </span>
      ),
    },
    {
      key: 'pattern',
      header: 'Valid',
      cell: (row) => (
        <DecoBadge variant={PERM_PATTERN.test(row.key) ? 'green' : 'red'} size="sm">
          {PERM_PATTERN.test(row.key) ? '✓' : '✗'}
        </DecoBadge>
      ),
      className: 'w-[60px] text-center',
      headerClassName: 'text-center',
    },
    {
      key: 'created',
      header: 'Created',
      cell: (row) => (
        <span className="font-mono text-[11px] text-deco-text-soft">
          {formatDate(row.createdAt)}
        </span>
      ),
      className: 'w-[120px]',
      sortable: true,
      sortValue: (row) => new Date(row.createdAt),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => {
        if (!canWritePermissions) return null;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditPerm(row);
              }}
              className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-soft hover:bg-deco-surface-hover hover:text-deco-amber transition-colors"
            >
              Edit
            </button>
            {canDeletePermissions && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletePerm(row);
                }}
                className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-dim hover:bg-deco-red/10 hover:text-deco-red transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        );
      },
      className: 'w-[120px]',
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
          title="Permissions"
          subtitle="Permission keys · format: domain:action"
          action={
            <div className="flex items-center gap-2">
              <AppSelector />
              {canWritePermissions && <DecoButton disabled>+ Create Permission</DecoButton>}
            </div>
          }
        />
        <EmptyState
          icon="◆"
          title="Select an organization"
          message="Choose an organization from the header to view its permissions"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Permissions"
        subtitle={`Permission keys · format: domain:action · ${permissions.length} total`}
        action={
          <div className="flex items-center gap-2">
            <AppSelector />
            {canWritePermissions && (
              <DecoButton onClick={() => setCreateOpen(true)}>
                + Create Permission
              </DecoButton>
            )}
          </div>
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
            placeholder="Search keys or descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-deco-border bg-deco-bg py-2 pl-8 pr-3 text-[13px] text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDomainFilter('all')}
            className={`rounded border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
              domainFilter === 'all'
                ? 'border-deco-amber/40 bg-deco-amber/10 text-deco-amber'
                : 'border-deco-border bg-transparent text-deco-text-dim hover:text-deco-text-soft'
            }`}
          >
            All
          </button>
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`rounded border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                domainFilter === d
                  ? 'border-deco-amber/40 bg-deco-amber/10 text-deco-amber'
                  : 'border-deco-border bg-transparent text-deco-text-dim hover:text-deco-text-soft'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[11px] text-deco-text-dim">
          {filtered.length} of {permissions.length} permissions
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="◆"
          title={search ? 'No results' : 'No permissions'}
          message={
            search
              ? `No permissions match "${search}"`
              : 'Create your first permission key to get started'
          }
        />
      ) : (
        <DecoTable
          columns={columns}
          data={filtered}
          rowKey={(row) => row.id}
        />
      )}

      {/* Modals */}
      <CreatePermModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        orgId={activeOrg?.id ?? ''}
        prefilledAppId={activeApp?.id}
        prefilledAppName={activeApp?.name}
      />

      {editPerm && (
        <EditPermModal
          open={!!editPerm}
          onClose={() => setEditPerm(null)}
          perm={editPerm}
        />
      )}

      <ConfirmDialog
        open={!!deletePerm}
        onClose={() => setDeletePerm(null)}
        onConfirm={handleDelete}
        title="Delete Permission"
        message={`Delete permission "${deletePerm?.key}"? Any roles using this permission will lose access.`}
        confirmLabel="Delete"
        isLoading={deletePermMutation.isPending}
      />
    </div>
  );
}
