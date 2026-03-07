import { cn } from '@lib/cn';
import type { ReactNode } from 'react';

/** Column definition for DecoTable */
export interface DecoColumnDef<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DecoTableProps<T> {
  columns: DecoColumnDef<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DecoTable<T>({ columns, data, rowKey, onRowClick, className }: DecoTableProps<T>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-deco-border bg-deco-surface shadow-deco-card',
        className,
      )}
    >
      {/* L-bracket corners */}
      <div className="pointer-events-none absolute left-1.5 top-1.5 h-2.5 w-2.5 border-l border-t border-deco-copper/30" />
      <div className="pointer-events-none absolute right-1.5 top-1.5 h-2.5 w-2.5 border-r border-t border-deco-copper/30" />
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 h-2.5 w-2.5 border-b border-l border-deco-copper/30" />
      <div className="pointer-events-none absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b border-r border-deco-copper/30" />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-deco-border-dim">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-deco-wide text-deco-text-copper',
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-deco-border-dim/50 transition-colors last:border-b-0',
                  onRowClick && 'cursor-pointer hover:bg-deco-amber/5',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-[13px] text-deco-text', col.className)}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
