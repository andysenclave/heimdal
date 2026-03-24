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
  DecoToggle,
  decoToast,
} from '@components/primitives';
import type { DecoColumnDef } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
} from '@api/hooks/useOrganizations';
import type { CreateOrgPayload, UpdateOrgPayload } from '@api/hooks/useOrganizations';
import { formatDate } from '@lib/format';
import { useDebounce } from '@hooks/useDebounce';
import type { Organization } from '@/types/models';

// --- Schemas ---

const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  plan: z.string().optional(),
});

const editOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  plan: z.string().optional(),
  isActive: z.boolean(),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;
type EditOrgForm = z.infer<typeof editOrgSchema>;

// --- Helpers ---

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const PLAN_OPTIONS = [
  { value: '', label: 'No plan' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// --- Create Modal ---

function CreateOrgModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createOrg = useCreateOrganization();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: '', slug: '', plan: '' },
  });

  const nameValue = watch('name');

  const onSubmit = async (data: CreateOrgForm) => {
    const payload: CreateOrgPayload = {
      name: data.name,
      slug: data.slug,
      plan: data.plan || null,
    };
    try {
      await createOrg.mutateAsync(payload);
      decoToast.success('Organization created');
      reset();
      onClose();
    } catch {
      decoToast.error('Failed to create organization');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    register('name').onChange(e);
    setValue('slug', slugify(e.target.value));
  };

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title="Create Organization"
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={createOrg.isPending}>
            {createOrg.isPending ? 'Creating...' : 'Create'}
          </DecoButton>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DecoInput
          label="Name"
          placeholder="My Organization"
          {...register('name')}
          onChange={handleNameChange}
          error={errors.name?.message}
        />
        <DecoInput
          label="Slug"
          placeholder="my-organization"
          mono
          value={watch('slug') || slugify(nameValue || '')}
          {...register('slug')}
          error={errors.slug?.message}
          hint="URL-safe identifier, auto-generated from name"
        />
        <DecoSelect label="Plan" {...register('plan')} error={errors.plan?.message}>
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </DecoSelect>
      </form>
    </DecoModal>
  );
}

// --- Edit Modal ---

function EditOrgModal({
  open,
  onClose,
  org,
}: {
  open: boolean;
  onClose: () => void;
  org: Organization;
}) {
  const updateOrg = useUpdateOrganization();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditOrgForm>({
    resolver: zodResolver(editOrgSchema),
    defaultValues: {
      name: org.name,
      slug: org.slug,
      plan: org.plan || '',
      isActive: org.isActive,
    },
  });

  const onSubmit = async (data: EditOrgForm) => {
    const payload: UpdateOrgPayload & { id: string } = {
      id: org.id,
      name: data.name,
      slug: data.slug,
      plan: data.plan || null,
      isActive: data.isActive,
    };
    try {
      await updateOrg.mutateAsync(payload);
      decoToast.success('Organization updated');
      onClose();
    } catch {
      decoToast.error('Failed to update organization');
    }
  };

  return (
    <DecoModal
      open={open}
      onClose={onClose}
      title="Edit Organization"
      footer={
        <>
          <DecoButton variant="ghost" onClick={onClose}>
            Cancel
          </DecoButton>
          <DecoButton onClick={handleSubmit(onSubmit)} disabled={updateOrg.isPending}>
            {updateOrg.isPending ? 'Saving...' : 'Save Changes'}
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
        <DecoInput
          label="Slug"
          mono
          {...register('slug')}
          error={errors.slug?.message}
        />
        <DecoSelect label="Plan" {...register('plan')} error={errors.plan?.message}>
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </DecoSelect>
        <div className="flex items-center justify-between rounded border border-deco-border-dim bg-deco-bg px-3 py-3">
          <div>
            <span className="block font-mono text-[10px] font-medium uppercase tracking-deco-wide text-deco-text-copper">
              Active
            </span>
            <span className="text-[12px] text-deco-text-dim">
              Inactive organizations cannot use the API
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

export default function Organizations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);

  const debouncedSearch = useDebounce(search, 250);
  const { data, isLoading } = useOrganizations();
  const deleteOrgMutation = useDeleteOrganization();

  const orgs = data?.data ?? [];

  // Filter + search
  const filtered = useMemo(() => {
    let result = orgs;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q),
      );
    }
    if (statusFilter === 'active') result = result.filter((o) => o.isActive);
    if (statusFilter === 'inactive') result = result.filter((o) => !o.isActive);
    return result;
  }, [orgs, debouncedSearch, statusFilter]);

  const handleDelete = async () => {
    if (!deleteOrg) return;
    try {
      await deleteOrgMutation.mutateAsync(deleteOrg.id);
      decoToast.success(`"${deleteOrg.name}" deleted`);
      setDeleteOrg(null);
    } catch {
      decoToast.error('Failed to delete organization');
    }
  };

  // --- Column definitions ---
  const columns: DecoColumnDef<Organization>[] = [
    {
      key: 'name',
      header: 'Organization',
      cell: (row) => (
        <div>
          <div className="font-semibold text-deco-text">{row.name}</div>
          <div className="font-mono text-[11px] text-deco-text-dim">{row.slug}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      cell: (row) =>
        row.plan ? (
          <DecoBadge
            variant={
              row.plan === 'enterprise'
                ? 'amber'
                : row.plan === 'pro'
                  ? 'purple'
                  : 'teal'
            }
          >
            {row.plan}
          </DecoBadge>
        ) : (
          <span className="font-mono text-[11px] text-deco-text-dim">—</span>
        ),
      className: 'w-[100px]',
    },
    {
      key: 'apps',
      header: 'Apps',
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-deco-teal">
          {row._count?.applications ?? 0}
        </span>
      ),
      className: 'w-[70px] text-center',
      headerClassName: 'text-center',
    },
    {
      key: 'members',
      header: 'Members',
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-deco-purple">
          {row._count?.memberships ?? 0}
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
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditOrg(row);
            }}
            className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-soft hover:bg-deco-surface-hover hover:text-deco-amber transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOrg(row);
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
        title="Organizations"
        subtitle="Manage tenant organizations and their plans"
        action={
          <DecoButton onClick={() => setCreateOpen(true)}>
            + Create Organization
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
            placeholder="Search by name or slug..."
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
          {filtered.length} of {orgs.length} organizations
        </span>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="◇"
          title={search ? 'No results' : 'No organizations'}
          message={
            search
              ? `No organizations match "${search}"`
              : 'Create your first organization to get started'
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
      <CreateOrgModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {editOrg && (
        <EditOrgModal
          open={!!editOrg}
          onClose={() => setEditOrg(null)}
          org={editOrg}
        />
      )}

      <ConfirmDialog
        open={!!deleteOrg}
        onClose={() => setDeleteOrg(null)}
        onConfirm={handleDelete}
        title="Delete Organization"
        message={`Are you sure you want to delete "${deleteOrg?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteOrgMutation.isPending}
      />
    </div>
  );
}
