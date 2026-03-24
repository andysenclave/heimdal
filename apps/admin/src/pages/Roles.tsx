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
  decoToast,
} from '@components/primitives';
import type { DecoColumnDef } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { RolePermissionsPanel, AppSelector } from '@components/sections';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@api/hooks/useRoles';
import type { CreateRolePayload, UpdateRolePayload } from '@api/hooks/useRoles';
import { useOrganizations } from '@api/hooks/useOrganizations';
import { useApplications } from '@api/hooks/useApplications';
import { useActiveOrg } from '@/context/OrgContext';
import { useActiveApp } from '@/context/AppContext';
import { useFeatureAccess } from '@auth/hooks/useRoleGate';
import { formatDate } from '@lib/format';
import { extractApiError } from '@lib/errors';
import { useDebounce } from '@hooks/useDebounce';
import type { Role } from '@/types/models';

// --- Schemas ---

const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Name must be lowercase alphanumeric with hyphens'),
  orgId: z.string().min(1, 'Organization is required'),
  appId: z.string().min(1, 'Application is required'),
  baseRoleId: z.string().optional(),
});

const editRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Name must be lowercase alphanumeric with hyphens'),
});

type CreateRoleForm = z.infer<typeof createRoleSchema>;
type EditRoleForm = z.infer<typeof editRoleSchema>;

// --- Filter options ---

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'system', label: 'System' },
  { value: 'custom', label: 'Custom' },
];

// --- Create Modal ---

function CreateRoleModal({
  open,
  onClose,
  prefilledOrgId,
  prefilledOrgName,
  prefilledAppId,
  prefilledAppName,
}: {
  open: boolean;
  onClose: () => void;
  prefilledOrgId?: string;
  prefilledOrgName?: string;
  prefilledAppId?: string;
  prefilledAppName?: string;
}) {
  const createRole = useCreateRole();
  // Only fetch org/app lists when values are not pre-supplied
  const { data: orgsData } = useOrganizations();
  const { data: appsData } = useApplications(prefilledOrgId);
  const { data: rolesData } = useRoles(prefilledAppId);

  const orgs = orgsData?.data ?? [];
  const apps = appsData?.data ?? [];
  const roles = rolesData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateRoleForm>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      orgId: prefilledOrgId ?? '',
      appId: prefilledAppId ?? '',
      baseRoleId: '',
    },
  });

  const selectedOrgId = watch('orgId');
  const selectedAppId = watch('appId');

  // When not pre-filled, filter apps by selected org
  const filteredApps = useMemo(
    () => (selectedOrgId ? apps.filter((a) => a.orgId === selectedOrgId) : apps),
    [apps, selectedOrgId],
  );

  // Parent role candidates scoped to the effective app
  const effectiveAppId = prefilledAppId ?? selectedAppId;
  const parentRoleOptions = useMemo(
    () => (effectiveAppId ? roles.filter((r) => r.appId === effectiveAppId) : []),
    [roles, effectiveAppId],
  );

  const onSubmit = async (data: CreateRoleForm) => {
    const payload: CreateRolePayload = {
      name: data.name,
      orgId: prefilledOrgId ?? data.orgId,
      appId: prefilledAppId ?? data.appId,
      baseRoleId: data.baseRoleId || undefined,
    };
    try {
      await createRole.mutateAsync(payload);
      decoToast.success('Role created');
      reset();
      onClose();
    } catch (err: unknown) {
      const message = await extractApiError(err, 'Failed to create role');
      decoToast.error(message);
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <DecoModal
      open={open}
      onClose={handleClose}
      title="Create Role"
      footer={
        <>
          <DecoButton variant="ghost" onClick={handleClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={createRole.isPending}>
            {createRole.isPending ? 'Creating...' : 'Create'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DecoInput
          label="Name"
          placeholder="my-custom-role"
          mono
          {...register('name')}
          error={errors.name?.message}
          hint="Lowercase alphanumeric with hyphens"
        />

        {/* Org — read-only when pre-filled, dropdown otherwise */}
        {prefilledOrgId ? (
          <div className="space-y-1">
            <label className="font-mono text-[11px] uppercase tracking-deco-wide text-deco-text-dim">
              Organization
            </label>
            <div className="rounded border border-deco-border bg-deco-bg px-3 py-2 font-mono text-xs text-deco-amber">
              {prefilledOrgName ?? prefilledOrgId}
            </div>
          </div>
        ) : (
          <DecoSelect label="Organization" {...register('orgId')} error={errors.orgId?.message}>
            <option value="">Select organization...</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </DecoSelect>
        )}

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
          <DecoSelect label="Application" {...register('appId')} error={errors.appId?.message}>
            <option value="">Select application...</option>
            {filteredApps.map((app) => (
              <option key={app.id} value={app.id}>{app.name}</option>
            ))}
          </DecoSelect>
        )}

        <DecoSelect
          label="Base Role (optional)"
          {...register('baseRoleId')}
          error={errors.baseRoleId?.message}
        >
          <option value="">None (standalone role)</option>
          {parentRoleOptions.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </DecoSelect>
        <p className="font-mono text-[10px] text-deco-text-dim -mt-2">
          This role will inherit all permissions from the base role
        </p>
      </form>
    </DecoModal>
  );
}

// --- Edit Modal ---

function EditRoleModal({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role: Role;
}) {
  const updateRole = useUpdateRole();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditRoleForm>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      name: role.name,
    },
  });

  const onSubmit = async (data: EditRoleForm) => {
    const payload: UpdateRolePayload & { id: string } = {
      id: role.id,
      name: data.name,
    };
    try {
      await updateRole.mutateAsync(payload);
      decoToast.success('Role updated');
      onClose();
    } catch {
      decoToast.error('Failed to update role');
    }
  };

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title="Edit Role"
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={updateRole.isPending}>
            {updateRole.isPending ? 'Saving...' : 'Save Changes'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DecoInput
          label="Name"
          mono
          {...register('name')}
          error={errors.name?.message}
          disabled={role.isSystem}
          hint={role.isSystem ? 'System role names cannot be changed' : undefined}
        />
        {role.isSystem && (
          <div className="rounded border border-deco-amber/20 bg-deco-amber/5 px-3 py-2">
            <span className="font-mono text-[10px] text-deco-amber">
              System roles have limited editability
            </span>
          </div>
        )}
      </form>
    </DecoModal>
  );
}

// --- Helpers ---

function resolveBaseRoleName(baseRoleId: string | null, roles: Role[]): string {
  if (!baseRoleId) return '';
  const base = roles.find((r) => r.id === baseRoleId);
  return base ? base.name : baseRoleId;
}

function resolveAppName(appId: string, apps: { id: string; name: string }[]): string {
  const app = apps.find((a) => a.id === appId);
  return app ? app.name : appId;
}

// --- Page ---

export default function Roles() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);

  const { activeOrg } = useActiveOrg();
  const { activeApp } = useActiveApp();
  const { canWriteRoles, canDeleteRoles } = useFeatureAccess();
  const debouncedSearch = useDebounce(search, 250);
  const { data, isLoading } = useRoles(activeApp?.id, activeOrg?.id);
  const { data: appsData } = useApplications(activeOrg?.id);
  const deleteRoleMutation = useDeleteRole();

  const roles = data?.data ?? [];
  const apps = appsData?.data ?? [];

  // Filter + search
  const filtered = useMemo(() => {
    let result = roles;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q),
      );
    }
    if (typeFilter === 'system') result = result.filter((r) => r.isSystem);
    if (typeFilter === 'custom') result = result.filter((r) => !r.isSystem);
    return result;
  }, [roles, debouncedSearch, typeFilter]);

  const handleDelete = async () => {
    if (!deleteRole) return;
    if (deleteRole.isSystem) {
      decoToast.error('System roles cannot be deleted');
      setDeleteRole(null);
      return;
    }
    try {
      await deleteRoleMutation.mutateAsync(deleteRole.id);
      decoToast.success(`"${deleteRole.name}" deleted`);
      setDeleteRole(null);
    } catch {
      decoToast.error('Failed to delete role');
    }
  };

  // --- Column definitions ---
  const columns: DecoColumnDef<Role>[] = [
    {
      key: 'name',
      header: 'Role',
      cell: (row) => (
        <div>
          <div className="font-semibold text-deco-text">{row.name}</div>
          <div className="font-mono text-[11px] text-deco-text-dim">{row.id}</div>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.name,
    },
    {
      key: 'parent',
      header: 'Base Role',
      cell: (row) =>
        row.baseRoleId ? (
          <span className="font-mono text-[12px] text-deco-text-soft">
            {resolveBaseRoleName(row.baseRoleId, roles)}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-deco-text-dim">&mdash;</span>
        ),
      className: 'w-[140px]',
    },
    {
      key: 'system',
      header: 'System',
      cell: (row) => (
        <DecoBadge variant={row.isSystem ? 'amber' : 'muted'}>
          {row.isSystem ? 'yes' : 'no'}
        </DecoBadge>
      ),
      className: 'w-[90px]',
    },
    {
      key: 'permCount',
      header: 'Perms',
      cell: (row) => (
        <DecoBadge variant={row._count?.rolePermissions ? 'teal' : 'muted'} size="sm">
          {row._count?.rolePermissions ?? 0}
        </DecoBadge>
      ),
      className: 'w-[60px] text-center',
      headerClassName: 'text-center',
    },
    {
      key: 'app',
      header: 'App',
      cell: (row) => (
        <span className="font-mono text-[12px] text-deco-text-soft">
          {resolveAppName(row.appId, apps)}
        </span>
      ),
      className: 'w-[150px]',
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
        if (!canWriteRoles) return null;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPermissionsRole(row);
              }}
              className="rounded px-2 py-1 font-mono text-[10px] text-deco-teal hover:bg-deco-teal/10 transition-colors"
            >
              Perms
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditRole(row);
              }}
              className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-soft hover:bg-deco-surface-hover hover:text-deco-amber transition-colors"
            >
              Edit
            </button>
            {canDeleteRoles && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (row.isSystem) {
                    decoToast.error('System roles cannot be deleted');
                    return;
                  }
                  setDeleteRole(row);
                }}
                disabled={row.isSystem}
                className={`rounded px-2 py-1 font-mono text-[10px] transition-colors ${
                  row.isSystem
                    ? 'cursor-not-allowed text-deco-text-dim/40'
                    : 'text-deco-text-dim hover:bg-deco-red/10 hover:text-deco-red'
                }`}
              >
                Delete
              </button>
            )}
          </div>
        );
      },
      className: 'w-[180px]',
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
        title="Roles"
        subtitle="Manage role hierarchy and assignments"
        action={
          <div className="flex items-center gap-2">
            <AppSelector />
            {canWriteRoles && (
              <DecoButton onClick={() => setCreateOpen(true)}>
                + Create Role
              </DecoButton>
            )}
          </div>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-deco-text-dim text-sm">
            &#x2315;
          </span>
          <input
            type="text"
            placeholder="Search by name or id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-deco-border bg-deco-bg py-2 pl-8 pr-3 text-[13px] text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`rounded border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                typeFilter === opt.value
                  ? 'border-deco-amber/40 bg-deco-amber/10 text-deco-amber'
                  : 'border-deco-border bg-transparent text-deco-text-dim hover:text-deco-text-soft'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[11px] text-deco-text-dim">
          {filtered.length} of {roles.length} roles
        </span>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="&#x25C7;"
          title={search ? 'No results' : 'No roles'}
          message={
            search
              ? `No roles match "${search}"`
              : 'Create your first role to get started'
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
      <CreateRoleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        prefilledOrgId={activeOrg?.id}
        prefilledOrgName={activeOrg?.name}
        prefilledAppId={activeApp?.id}
        prefilledAppName={activeApp?.name}
      />

      {editRole && (
        <EditRoleModal
          open={!!editRole}
          onClose={() => setEditRole(null)}
          role={editRole}
        />
      )}

      {permissionsRole && (
        <RolePermissionsPanel
          open={!!permissionsRole}
          onClose={() => setPermissionsRole(null)}
          role={permissionsRole}
        />
      )}

      <ConfirmDialog
        open={!!deleteRole}
        onClose={() => setDeleteRole(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Are you sure you want to delete "${deleteRole?.name}"? This action cannot be undone. Any users assigned this role will lose its permissions.`}
        confirmLabel="Delete"
        isLoading={deleteRoleMutation.isPending}
      />
    </div>
  );
}
