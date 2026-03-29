import { useQuery } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { AuditLogEntry } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  actorId?: string;
}

async function fetchAuditLog(
  filters?: AuditLogFilters,
): Promise<PaginatedResponse<AuditLogEntry>> {
  const searchParams: Record<string, string> = {};
  if (filters?.action) searchParams['action'] = filters.action;
  if (filters?.resourceType) searchParams['resourceType'] = filters.resourceType;
  if (filters?.actorId) searchParams['actorId'] = filters.actorId;

  return api
    .get('admin/audit/logs', { retry: 0, timeout: 5000, searchParams })
    .json<PaginatedResponse<AuditLogEntry>>();
}

export function useAuditLog(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: queryKeys.auditLog.list(filters as Record<string, unknown> | undefined),
    queryFn: () => fetchAuditLog(filters),
  });
}
