import { DecoTable, DecoBadge } from '@components/primitives';
import type { DecoColumnDef } from '@components/primitives';
import { formatDate } from '@lib/format';
import type { Organization } from '@/types/models';

export function OrganizationsTable({
  orgs,
  onEdit,
  onDelete,
}: {
  orgs: Organization[];
  onEdit: (org: Organization) => void;
  onDelete: (org: Organization) => void;
}) {
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
              onEdit(row);
            }}
            className="rounded px-2 py-1 font-mono text-[10px] text-deco-text-soft hover:bg-deco-surface-hover hover:text-deco-amber transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row);
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

  return (
    <DecoTable
      columns={columns}
      data={orgs}
      rowKey={(row) => row.id}
    />
  );
}
