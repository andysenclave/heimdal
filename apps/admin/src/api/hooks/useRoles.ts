import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { Role, Permission } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

async function fetchRoles(appId?: string, orgId?: string): Promise<PaginatedResponse<Role>> {
  const searchParams: Record<string, string> = {};
  if (appId) searchParams.appId = appId;
  if (orgId) searchParams.orgId = orgId;
  const roles = await api
    .get('admin/roles', {
      searchParams: Object.keys(searchParams).length ? searchParams : undefined,
      retry: 0,
      timeout: 5000,
    })
    .json<Role[]>();
  return { data: roles, total: roles.length, page: 1, pageSize: roles.length };
}

async function fetchRole(id: string): Promise<Role> {
  return api.get(`admin/roles/${id}`, { retry: 0, timeout: 5000 }).json<Role>();
}

export interface CreateRolePayload {
  name: string;
  orgId: string;
  appId: string;
  baseRoleId?: string;
  description?: string;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

async function createRole(payload: CreateRolePayload): Promise<Role> {
  const { appId, ...body } = payload;
  return api.post(`admin/apps/${appId}/roles`, { json: body }).json<Role>();
}

async function updateRole(id: string, payload: UpdateRolePayload): Promise<Role> {
  return api.patch(`admin/roles/${id}`, { json: payload }).json<Role>();
}

async function deleteRole(id: string): Promise<void> {
  await api.delete(`admin/roles/${id}`);
}

export function useRoles(appId?: string, orgId?: string) {
  return useQuery({
    queryKey: appId
      ? queryKeys.roles.byApp(appId)
      : orgId
        ? queryKeys.roles.byOrg(orgId)
        : queryKeys.roles.all,
    queryFn: () => fetchRoles(appId, orgId),
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

export function useAssignPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      permissionIds,
    }: {
      roleId: string;
      permissionIds: string[];
    }) => {
      return api
        .post(`admin/roles/${roleId}/permissions`, { json: { permissionIds } })
        .json<Role>();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useRemovePermissionFromRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      permissionId,
    }: {
      roleId: string;
      permissionId: string;
    }) => {
      await api.delete(`admin/roles/${roleId}/permissions/${permissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useRoleWithPermissions(roleId: string) {
  return useQuery({
    queryKey: [...queryKeys.roles.detail(roleId), 'permissions'],
    queryFn: () =>
      api
        .get(`admin/roles/${roleId}`)
        .json<
          Role & {
            rolePermissions?: { permission: Permission }[];
          }
        >(),
    enabled: !!roleId,
  });
}
