import { useState, useMemo } from 'react';
import { DecoButton, decoToast } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { CreateOrgModal, EditOrgModal, OrganizationsTable } from '@components/sections';
import {
  useOrganizations,
  useDeleteOrganization,
} from '@api/hooks/useOrganizations';
import { useDebounce } from '@hooks/useDebounce';
import type { Organization } from '@/types/models';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

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
        <OrganizationsTable
          orgs={filtered}
          onEdit={setEditOrg}
          onDelete={setDeleteOrg}
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
