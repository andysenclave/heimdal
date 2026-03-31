import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { Organization } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

async function fetchOrganizations(): Promise<PaginatedResponse<Organization>> {
  const orgs = await api.get('admin/orgs').json<Organization[]>();
  return { data: orgs, total: orgs.length, page: 1, pageSize: orgs.length };
}

async function fetchOrganization(id: string): Promise<Organization> {
  return api.get(`admin/orgs/${id}`).json<Organization>();
}

export interface CreateOrgPayload {
  name: string;
  slug: string;
  plan?: string | null;
}

export interface UpdateOrgPayload {
  name?: string;
  slug?: string;
  plan?: string | null;
  isActive?: boolean;
}

async function createOrganization(payload: CreateOrgPayload): Promise<Organization> {
  return api.post('admin/orgs', { json: payload }).json<Organization>();
}

async function updateOrganization(id: string, payload: UpdateOrgPayload): Promise<Organization> {
  return api.patch(`admin/orgs/${id}`, { json: payload }).json<Organization>();
}

async function deleteOrganization(id: string): Promise<void> {
  await api.delete(`admin/orgs/${id}`);
}

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.orgs.all,
    queryFn: fetchOrganizations,
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: queryKeys.orgs.detail(id),
    queryFn: () => fetchOrganization(id),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgs.all });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateOrgPayload & { id: string }) =>
      updateOrganization(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgs.all });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgs.all });
    },
  });
}
