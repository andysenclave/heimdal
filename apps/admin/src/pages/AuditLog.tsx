import { useState, useMemo } from 'react';
import {
  DecoTable,
  DecoBadge,
  DecoAvatar,
} from '@components/primitives';
import type { DecoColumnDef } from '@components/primitives';
import { PageHeader } from '@components/common/PageHeader';
import { EmptyState } from '@components/common/EmptyState';
import { useAuditLog } from '@api/hooks/useAuditLog';
import { formatDateTime } from '@lib/format';
import { useDebounce } from '@hooks/useDebounce';
import type { AuditLogEntry } from '@/types/models';

// --- Action color mapping ---

type BadgeVariant = 'teal' | 'green' | 'amber' | 'red' | 'purple' | 'muted';

function actionVariant(action: string): BadgeVariant {
  if (action.startsWith('user.login') || action.includes('auth')) return 'teal';
  if (action.includes('create') || action.includes('register')) return 'green';
  if (action.includes('update') || action.includes('assign') || action.includes('invite'))
    return 'amber';
  if (action.includes('delete') || action.includes('revoke')) return 'red';
  if (action.startsWith('guard.check')) return 'purple';
  return 'muted';
}

// --- Filter options ---

const ACTION_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'login', label: 'Login' },
  { value: 'create', label: 'Create' },
  { value: 'assign', label: 'Assign' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'guard.check', label: 'Guard' },
] as const;

// --- Metadata summary ---

function metadataSummary(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return '--';
  return entries
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ');
}

// --- Page ---

export default function AuditLog() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const debouncedSearch = useDebounce(search, 250);
  const { data, isLoading } = useAuditLog();

  const entries = data?.data ?? [];

  // Sort reverse chronological, then filter
  const filtered = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    let result = sorted;

    // Action filter
    if (actionFilter !== 'all') {
      result = result.filter((e) => e.action.includes(actionFilter));
    }

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          e.resourceType.toLowerCase().includes(q) ||
          e.resourceId.toLowerCase().includes(q) ||
          (e.actor?.name && e.actor.name.toLowerCase().includes(q)) ||
          (e.actor?.email && e.actor.email.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [entries, actionFilter, debouncedSearch]);

  // --- Column definitions ---
  const columns: DecoColumnDef<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (row) => (
        <span className="font-mono text-[11px] text-deco-text-soft">
          {formatDateTime(row.createdAt)}
        </span>
      ),
      className: 'w-[150px]',
    },
    {
      key: 'actor',
      header: 'Actor',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <DecoAvatar name={row.actor?.name ?? 'Unknown'} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-deco-text">
              {row.actor?.name ?? 'Unknown'}
            </div>
            <div className="truncate font-mono text-[10px] text-deco-text-dim">
              {row.actor?.email ?? row.actorId}
            </div>
          </div>
        </div>
      ),
      className: 'min-w-[180px]',
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => (
        <DecoBadge variant={actionVariant(row.action)} size="sm">
          {row.action}
        </DecoBadge>
      ),
      className: 'w-[160px]',
    },
    {
      key: 'resource',
      header: 'Resource',
      cell: (row) => (
        <div>
          <span className="font-mono text-[11px] font-semibold text-deco-text-soft">
            {row.resourceType}
          </span>
          <span className="ml-1.5 font-mono text-[10px] text-deco-text-dim">
            {row.resourceId}
          </span>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      cell: (row) => (
        <span className="font-mono text-[10px] text-deco-text-dim leading-relaxed">
          {metadataSummary(row.metadata)}
        </span>
      ),
      className: 'max-w-[260px]',
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
        title="Audit Log"
        subtitle="System events, guard decisions, and user activity"
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-deco-text-dim text-sm">
            &#x2315;
          </span>
          <input
            type="text"
            placeholder="Search by action, actor, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-deco-border bg-deco-bg py-2 pl-8 pr-3 text-[13px] text-deco-text placeholder:text-deco-text-dim focus:border-deco-amber/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {ACTION_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActionFilter(opt.value)}
              className={`rounded border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors ${
                actionFilter === opt.value
                  ? 'border-deco-amber/40 bg-deco-amber/10 text-deco-amber'
                  : 'border-deco-border bg-transparent text-deco-text-dim hover:text-deco-text-soft'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[11px] text-deco-text-dim">
          {filtered.length} of {entries.length} events
        </span>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="&#x25C8;"
          title={search || actionFilter !== 'all' ? 'No results' : 'No audit entries'}
          message={
            search || actionFilter !== 'all'
              ? 'No events match the current filters'
              : 'Audit log entries will appear here as activity occurs'
          }
        />
      ) : (
        <DecoTable
          columns={columns}
          data={filtered}
          rowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
