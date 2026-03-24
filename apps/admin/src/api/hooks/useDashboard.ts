import { useQuery } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';

export interface DashboardStats {
  orgCount: number;
  appCount: number;
  userCount: number;
  roleCount: number;
  permissionCount: number;
  pendingInviteCount: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => api.get('admin/dashboard/stats').json<DashboardStats>(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
