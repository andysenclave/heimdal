import { useQuery } from '@tanstack/react-query';
import { api } from '@api/client';
import type { AppUsersResponse } from '@/types/models';

/**
 * Fetches SDK-registered users for a specific application.
 * These are end-users created via the SDK — they cannot access Heimdal admin.
 */
export function useAppUsers(appId?: string) {
  return useQuery<AppUsersResponse>({
    queryKey: ['app-users', appId],
    queryFn: () => api.get(`admin/apps/${appId}/users`).json<AppUsersResponse>(),
    enabled: !!appId,
  });
}
