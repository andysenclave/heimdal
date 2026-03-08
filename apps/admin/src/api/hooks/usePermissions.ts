import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { Permission } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

async function fetchPermissions(appId?: string): Promise<PaginatedResponse<Permission>> {
  const searchParams = appId ? { appId } : undefined;
  const perms = await api
    .get('admin/permissions', { searchParams, retry: 0, timeout: 5000 })
    .json<Permission[]>();
  return { data: perms, total: perms.length, page: 1, pageSize: perms.length };
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
  const { appId, ...body } = payload;
  return api.post(`admin/apps/${appId}/permissions`, { json: body }).json<Permission>();
}

async function updatePermission(id: string, payload: UpdatePermPayload): Promise<Permission> {
  return api.patch(`admin/permissions/${id}`, { json: payload }).json<Permission>();
}

async function deletePermission(id: string): Promise<void> {
  await api.delete(`admin/permissions/${id}`);
}

export function usePermissions(appId?: string) {
  return useQuery({
    queryKey: appId ? queryKeys.permissions.byApp(appId) : queryKeys.permissions.byApp('all'),
    queryFn: () => fetchPermissions(appId),
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
