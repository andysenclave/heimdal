import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { Role } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

// Mock data for development when API is unavailable
const MOCK_ROLES: Role[] = [
  {
    id: 'role_cuid001',
    orgId: 'org_cuid001',
    appId: 'app_cuid001',
    name: 'super-admin',
    parentRoleId: null,
    isSystem: true,
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2025-11-01T10:00:00Z',
  },
  {
    id: 'role_cuid002',
    orgId: 'org_cuid001',
    appId: 'app_cuid001',
    name: 'org-admin',
    parentRoleId: 'role_cuid001',
    isSystem: true,
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2025-11-01T10:00:00Z',
  },
  {
    id: 'role_cuid003',
    orgId: 'org_cuid001',
    appId: 'app_cuid001',
    name: 'app-admin',
    parentRoleId: 'role_cuid002',
    isSystem: false,
    createdAt: '2025-11-15T14:00:00Z',
    updatedAt: '2026-01-10T09:30:00Z',
  },
  {
    id: 'role_cuid004',
    orgId: 'org_cuid001',
    appId: 'app_cuid001',
    name: 'editor',
    parentRoleId: 'role_cuid003',
    isSystem: false,
    createdAt: '2025-12-01T08:00:00Z',
    updatedAt: '2026-02-05T11:00:00Z',
  },
  {
    id: 'role_cuid005',
    orgId: 'org_cuid001',
    appId: 'app_cuid001',
    name: 'viewer',
    parentRoleId: 'role_cuid003',
    isSystem: false,
    createdAt: '2025-12-01T08:00:00Z',
    updatedAt: '2026-02-05T11:00:00Z',
  },
  {
    id: 'role_cuid006',
    orgId: 'org_cuid002',
    appId: 'app_cuid003',
    name: 'super-admin',
    parentRoleId: null,
    isSystem: true,
    createdAt: '2025-12-10T08:00:00Z',
    updatedAt: '2025-12-10T08:00:00Z',
  },
  {
    id: 'role_cuid007',
    orgId: 'org_cuid002',
    appId: 'app_cuid003',
    name: 'analyst',
    parentRoleId: 'role_cuid006',
    isSystem: false,
    createdAt: '2026-01-05T14:00:00Z',
    updatedAt: '2026-03-01T11:00:00Z',
  },
  {
    id: 'role_cuid008',
    orgId: 'org_cuid001',
    appId: 'app_cuid001',
    name: 'billing-manager',
    parentRoleId: 'role_cuid002',
    isSystem: false,
    createdAt: '2026-01-20T16:00:00Z',
    updatedAt: '2026-02-28T10:00:00Z',
  },
  {
    id: 'role_cuid009',
    orgId: 'org_cuid003',
    appId: 'app_cuid006',
    name: 'super-admin',
    parentRoleId: null,
    isSystem: true,
    createdAt: '2026-01-05T14:00:00Z',
    updatedAt: '2026-01-05T14:00:00Z',
  },
  {
    id: 'role_cuid010',
    orgId: 'org_cuid003',
    appId: 'app_cuid006',
    name: 'content-creator',
    parentRoleId: 'role_cuid009',
    isSystem: false,
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-03-06T08:30:00Z',
  },
];

async function fetchRoles(appId?: string): Promise<PaginatedResponse<Role>> {
  try {
    const endpoint = appId ? `roles?appId=${appId}` : 'roles';
    return await api.get(endpoint, { retry: 0, timeout: 5000 }).json<PaginatedResponse<Role>>();
  } catch {
    // Dev fallback
    if (import.meta.env.DEV) {
      const data = appId ? MOCK_ROLES.filter((r) => r.appId === appId) : MOCK_ROLES;
      return { data, total: data.length, page: 1, pageSize: 25 };
    }
    throw new Error('Failed to fetch roles');
  }
}

async function fetchRole(id: string): Promise<Role> {
  try {
    return await api.get(`roles/${id}`, { retry: 0, timeout: 5000 }).json<Role>();
  } catch {
    if (import.meta.env.DEV) {
      const role = MOCK_ROLES.find((r) => r.id === id);
      if (role) return role;
    }
    throw new Error('Role not found');
  }
}

export interface CreateRolePayload {
  name: string;
  orgId: string;
  appId: string;
  parentRoleId?: string;
}

export interface UpdateRolePayload {
  name?: string;
}

async function createRole(payload: CreateRolePayload): Promise<Role> {
  try {
    return await api.post('roles', { json: payload }).json<Role>();
  } catch {
    if (import.meta.env.DEV) {
      const newRole: Role = {
        id: `role_${Date.now()}`,
        name: payload.name,
        orgId: payload.orgId,
        appId: payload.appId,
        parentRoleId: payload.parentRoleId ?? null,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_ROLES.push(newRole);
      return newRole;
    }
    throw new Error('Failed to create role');
  }
}

async function updateRole(id: string, payload: UpdateRolePayload): Promise<Role> {
  try {
    return await api.patch(`roles/${id}`, { json: payload }).json<Role>();
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_ROLES.findIndex((r) => r.id === id);
      if (idx >= 0) {
        MOCK_ROLES[idx] = { ...MOCK_ROLES[idx], ...payload, updatedAt: new Date().toISOString() };
        return MOCK_ROLES[idx];
      }
    }
    throw new Error('Failed to update role');
  }
}

async function deleteRole(id: string): Promise<void> {
  try {
    await api.delete(`roles/${id}`);
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_ROLES.findIndex((r) => r.id === id);
      if (idx >= 0) MOCK_ROLES.splice(idx, 1);
      return;
    }
    throw new Error('Failed to delete role');
  }
}

export function useRoles(appId?: string) {
  return useQuery({
    queryKey: appId ? queryKeys.roles.byApp(appId) : queryKeys.roles.all,
    queryFn: () => fetchRoles(appId),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => fetchRole(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateRolePayload & { id: string }) =>
      updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}
