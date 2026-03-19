import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DecoToggle,
  decoToast,
} from '@components/primitives';
import type { DecoColumnDef } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import {
  useApplications,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
} from '@api/hooks/useApplications';
import type { CreateAppPayload, UpdateAppPayload, CreatedApplication } from '@api/hooks/useApplications';
import { useOrganizations } from '@api/hooks/useOrganizations';
import { ROUTES } from '@lib/constants';
import { formatDate } from '@lib/format';
import { useDebounce } from '@hooks/useDebounce';
import type { Application } from '@/types/models';

// --- Schemas ---

const createAppSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  orgId: z.string().min(1, 'Organization is required'),
});

const editAppSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  isActive: z.boolean(),
});

type CreateAppForm = z.infer<typeof createAppSchema>;
type EditAppForm = z.infer<typeof editAppSchema>;

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// --- Create Modal ---

function CreateAppModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createApp = useCreateApplication();
  const { data: orgsData } = useOrganizations();
  const orgs = orgsData?.data ?? [];
  const [created, setCreated] = useState<CreatedApplication | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAppForm>({
    resolver: zodResolver(createAppSchema),
    defaultValues: { name: '', orgId: '' },
  });

  const handleClose = () => {
    setCreated(null);
    reset();
    onClose();
  };

  const onSubmit = async (data: CreateAppForm) => {
    const payload: CreateAppPayload = { name: data.name, orgId: data.orgId };
    try {
      const result = await createApp.mutateAsync(payload);
      setCreated(result);
    } catch {
      decoToast.error('Failed to create application');
    }
  };

  // Success state — show credentials once
  if (created) {
    return (
      <DecoModal
        open={open}
        onClose={handleClose}
        title="Application Created"
        footer={
          <DecoButton onClick={handleClose}>Done</DecoButton>
        }
      >
        <div className="space-y-3">
          <p className="text-[13px] text-deco-text-soft">
            Save the App Secret now — it will not be shown again.
          </p>
          <div className="rounded border border-deco-border-dim bg-deco-bg px-3 py-3 space-y-2">
            <div>
              <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
                App ID
              </span>
              <span className="font-mono text-[12px] text-deco-text-dim select-all">{created.appId}</span>
            </div>
            <div>
              <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-red">
                App Secret (shown once)
              </span>
              <span className="font-mono text-[12px] text-deco-text select-all">{created.appSecretPlain}</span>
            </div>
          </div>
        </div>
      </DecoModal>
    );
  }

  return (
    <DecoModal
      open={open}
      onClose={handleClose}
      title="Create Application"
      footer={
        <>
          <DecoButton variant="ghost" onClick={handleClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={createApp.isPending}>
            {createApp.isPending ? 'Creating...' : 'Create'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DecoInput
          label="Name"
          placeholder="My Application"
          {...register('name')}
          error={errors.name?.message}
        />
        <DecoSelect
          label="Organization"
          {...register('orgId')}
          error={errors.orgId?.message}
        >
          <option value="">Select an organization</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </DecoSelect>
        <div className="rounded border border-deco-border-dim bg-deco-bg px-3 py-2">
          <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
            App ID
          </span>
          <span className="font-mono text-[12px] text-deco-text-dim">Auto-generated on creation</span>
        </div>
      </form>
    </DecoModal>
  );
}

// --- Edit Modal ---

function EditAppModal({
  open,
  onClose,
  app,
}: {
  open: boolean;
  onClose: () => void;
  app: Application;
}) {
  const updateApp = useUpdateApplication();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditAppForm>({
    resolver: zodResolver(editAppSchema),
    defaultValues: {
      name: app.name,
      isActive: app.isActive,
    },
  });

  const onSubmit = async (data: EditAppForm) => {
    const payload: UpdateAppPayload & { id: string } = {
      id: app.id,
      name: data.name,
      isActive: data.isActive,
    };
    try {
      await updateApp.mutateAsync(payload);
      decoToast.success('Application updated');
      onClose();
    } catch {
      decoToast.error('Failed to update application');
    }
  };

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title="Edit Application"
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={updateApp.isPending}>
            {updateApp.isPending ? 'Saving...' : 'Save Changes'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DecoInput
          label="Name"
          {...register('name')}
          error={errors.name?.message}
        />
        <div className="rounded border border-deco-border-dim bg-deco-bg px-3 py-3">
          <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
            App ID
          </span>
          <span className="font-mono text-[12px] text-deco-text-dim">
            {app.appId}
          </span>
        </div>
        <div className="flex items-center justify-between rounded border border-deco-border-dim bg-deco-bg px-3 py-3">
          <div>
            <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
              Active
            </span>
            <span className="text-[12px] text-deco-text-dim">
              Inactive applications cannot use the API
            </span>
          </div>
          <DecoToggle
            checked={watch('isActive')}
            onChange={(v) => setValue('isActive', v)}
          />
        </div>
      </form>
    </DecoModal>
  );
}

// --- Page ---

export default function Applications() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [deleteApp, setDeleteApp] = useState<Application | null>(null);

  const debouncedSearch = useDebounce(search, 250);
  const { data, isLoading } = useApplications();
  const deleteAppMutation = useDeleteApplication();

  const apps = data?.data ?? [];

  // Filter + search
  const filtered = useMemo(() => {
    let result = apps;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) || a.appId.toLowerCase().includes(q),
      );
    }
    if (statusFilter === 'active') result = result.filter((a) => a.isActive);
    if (statusFilter === 'inactive') result = result.filter((a) => !a.isActive);
    return result;
  }, [apps, debouncedSearch, statusFilter]);

  const handleDelete = async () => {
    if (!deleteApp) return;
    try {
      await deleteAppMutation.mutateAsync(deleteApp.id);
      decoToast.success(`"${deleteApp.name}" deleted`);
      setDeleteApp(null);
    } catch {
      decoToast.error('Failed to delete application');
    }
  };

  // --- Column definitions ---
  const columns: DecoColumnDef<Application>[] = [
    {
      key: 'name',
      header: 'Application',
      cell: (row) => (
        <div>
          <div className="font-semibold text-deco-text">{row.name}</div>
          <div className="font-mono text-[11px] text-deco-text-dim">{row.appId}</div>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.name,
    },
    {
      key: 'org',
      header: 'Org',
      cell: (row) => (
        <span className="font-mono text-[11px] text-deco-text-soft">{row.orgId}</span>
      ),
      className: 'w-[140px]',
    },
    {
      key: 'roles',
      header: 'Roles',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(ROUTES.ROLES);
          }}
          className="font-mono text-sm font-semibold text-deco-teal hover:underline cursor-pointer transition-colors"
          title="View roles for this application"
        >
          {row._count?.roles ?? 0}
        </button>
      ),
      className: 'w-[70px] text-center',
      headerClassName: 'text-center',
      sortable: true,
      sortValue: (row) => row._count?.roles ?? 0,
    },
    {
      key: 'permissions',
      header: 'Perms',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(ROUTES.PERMISSIONS);
          }}
          className="font-mono text-sm font-semibold text-deco-purple hover:underline cursor-pointer transition-colors"
          title="View permissions for this application"
        >
          {row._count?.permissions ?? 0}
        </button>
      ),
      className: 'w-[70px] text-center',
      headerClassName: 'text-center',
    },
    {
      key: 'bindings',
      header: 'Bindings',
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-deco-amber">
          {row._count?.accessBindings ?? 0}
        </span>
      ),
      className: 'w-[80px] text-center',
      headerClassName: 'text-center',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <DecoBadge variant={row.isActive ? 'green' : 'red'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </DecoBadge>
      ),
      className: 'w-[90px]',
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
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditApp(row);
            }}
            className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-soft hover:bg-deco-surface-hover hover:text-deco-amber transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteApp(row);
            }}
            className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-dim hover:bg-deco-red/10 hover:text-deco-red transition-colors"
          >
            Delete
          </button>
        </div>
      ),
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Applications"
        subtitle="Manage applications and their access configurations"
        action={
          <DecoButton onClick={() => setCreateOpen(true)}>
            + Create Application
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
            placeholder="Search by name or app ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-deco-border bg-deco-bg py-2 pl-8 pr-3 text-[13px] text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                statusFilter === opt.value
                  ? 'border-deco-amber/40 bg-deco-amber/10 text-deco-amber'
                  : 'border-deco-border bg-transparent text-deco-text-dim hover:text-deco-text-soft'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[11px] text-deco-text-dim">
          {filtered.length} of {apps.length} applications
        </span>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="◇"
          title={search ? 'No results' : 'No applications'}
          message={
            search
              ? `No applications match "${search}"`
              : 'Create your first application to get started'
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
      <CreateAppModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {editApp && (
        <EditAppModal
          open={!!editApp}
          onClose={() => setEditApp(null)}
          app={editApp}
        />
      )}

      <ConfirmDialog
        open={!!deleteApp}
        onClose={() => setDeleteApp(null)}
        onConfirm={handleDelete}
        title="Delete Application"
        message={`Are you sure you want to delete "${deleteApp?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteAppMutation.isPending}
      />
    </div>
  );
}
