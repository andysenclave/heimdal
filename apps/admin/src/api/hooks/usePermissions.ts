import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { Permission } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

const MOCK_PERMISSIONS: Permission[] = [
  {
    id: 'perm_001',
    orgId: 'org_cuid001',
    appId: 'app_ck7f801',
    key: 'portfolio:read',
    description: 'View portfolio holdings and performance',
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2025-11-10T10:00:00Z',
  },
  {
    id: 'perm_002',
    orgId: 'org_cuid001',
    appId: 'app_ck7f801',
    key: 'portfolio:write',
    description: 'Create and modify portfolio entries',
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2025-11-10T10:00:00Z',
  },
  {
    id: 'perm_003',
    orgId: 'org_cuid001',
    appId: 'app_ck7f801',
    key: 'trade:execute',
    description: 'Execute buy/sell trades',
    createdAt: '2025-11-15T14:00:00Z',
    updatedAt: '2025-11-15T14:00:00Z',
  },
  {
    id: 'perm_004',
    orgId: 'org_cuid001',
    appId: 'app_ck7f801',
    key: 'trade:read',
    description: 'View trade history and pending orders',
    createdAt: '2025-11-15T14:00:00Z',
    updatedAt: '2025-11-15T14:00:00Z',
  },
  {
    id: 'perm_005',
    orgId: 'org_cuid001',
    appId: 'app_ck7f801',
    key: 'watchlist:manage',
    description: 'Create and manage watchlists',
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2025-12-01T09:00:00Z',
  },
  {
    id: 'perm_006',
    orgId: 'org_cuid001',
    appId: 'app_ck7f802',
    key: 'user:read',
    description: 'View user profiles and details',
    createdAt: '2025-12-05T11:00:00Z',
    updatedAt: '2025-12-05T11:00:00Z',
  },
  {
    id: 'perm_007',
    orgId: 'org_cuid001',
    appId: 'app_ck7f802',
    key: 'user:manage',
    description: 'Create, update, and deactivate users',
    createdAt: '2025-12-05T11:00:00Z',
    updatedAt: '2025-12-05T11:00:00Z',
  },
  {
    id: 'perm_008',
    orgId: 'org_cuid002',
    appId: 'app_ck7f803',
    key: 'report:generate',
    description: 'Generate and export reports',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'perm_009',
    orgId: 'org_cuid002',
    appId: 'app_ck7f803',
    key: 'settings:manage',
    description: 'Modify application settings',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'perm_010',
    orgId: 'org_cuid001',
    appId: 'app_ck7f801',
    key: 'audit:read',
    description: 'View audit log entries',
    createdAt: '2026-02-01T16:00:00Z',
    updatedAt: '2026-02-01T16:00:00Z',
  },
];

async function fetchPermissions(): Promise<PaginatedResponse<Permission>> {
  try {
    return await api
      .get('permissions', { retry: 0, timeout: 5000 })
      .json<PaginatedResponse<Permission>>();
  } catch {
    if (import.meta.env.DEV) {
      return { data: MOCK_PERMISSIONS, total: MOCK_PERMISSIONS.length, page: 1, pageSize: 50 };
    }
    throw new Error('Failed to fetch permissions');
  }
}

export interface CreatePermPayload {
  key: string;
  description?: string | null;
  orgId: string;
  appId: string;
}

export interface UpdatePermPayload {
  description?: string | null;
}

async function createPermission(payload: CreatePermPayload): Promise<Permission> {
  try {
    return await api.post('permissions', { json: payload }).json<Permission>();
  } catch {
    if (import.meta.env.DEV) {
      const p: Permission = {
        id: `perm_${Date.now()}`,
        orgId: payload.orgId,
        appId: payload.appId,
        key: payload.key,
        description: payload.description ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_PERMISSIONS.push(p);
      return p;
    }
    throw new Error('Failed to create permission');
  }
}

async function updatePermission(id: string, payload: UpdatePermPayload): Promise<Permission> {
  try {
    return await api.patch(`permissions/${id}`, { json: payload }).json<Permission>();
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_PERMISSIONS.findIndex((p) => p.id === id);
      if (idx >= 0) {
        MOCK_PERMISSIONS[idx] = {
          ...MOCK_PERMISSIONS[idx],
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        return MOCK_PERMISSIONS[idx];
      }
    }
    throw new Error('Failed to update permission');
  }
}

async function deletePermission(id: string): Promise<void> {
  try {
    await api.delete(`permissions/${id}`);
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_PERMISSIONS.findIndex((p) => p.id === id);
      if (idx >= 0) MOCK_PERMISSIONS.splice(idx, 1);
      return;
    }
    throw new Error('Failed to delete permission');
  }
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.permissions.byApp('all'),
    queryFn: fetchPermissions,
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePermPayload & { id: string }) =>
      updatePermission(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
}
