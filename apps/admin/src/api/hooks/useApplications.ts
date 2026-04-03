import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { Application } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

async function fetchApplications(orgId?: string): Promise<PaginatedResponse<Application>> {
  const searchParams = orgId ? { orgId } : undefined;
  const apps = await api
    .get('admin/apps', { searchParams, retry: 0, timeout: 5000 })
    .json<Application[]>();
  return { data: apps, total: apps.length, page: 1, pageSize: apps.length };
}

async function fetchApplication(id: string): Promise<Application> {
  return api.get(`admin/apps/${id}`, { retry: 0, timeout: 5000 }).json<Application>();
}

export interface CreateAppPayload {
  name: string;
  orgId: string;
  description?: string;
}

export interface UpdateAppPayload {
  name?: string;
  isActive?: boolean;
  description?: string;
}

// Shape returned on create — includes secret shown once
export interface CreatedApplication extends Application {
  appSecretPlain: string;
}

async function createApplication(payload: CreateAppPayload): Promise<CreatedApplication> {
  return api.post('admin/apps', { json: payload }).json<CreatedApplication>();
}

async function updateApplication(id: string, payload: UpdateAppPayload): Promise<Application> {
  return api.patch(`admin/apps/${id}`, { json: payload }).json<Application>();
}

async function deleteApplication(id: string): Promise<void> {
  await api.delete(`admin/apps/${id}`);
}

export function useApplications(orgId?: string) {
  return useQuery({
    queryKey: orgId ? queryKeys.apps.byOrg(orgId) : queryKeys.apps.all,
    queryFn: () => fetchApplications(orgId),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: queryKeys.apps.detail(id),
    queryFn: () => fetchApplication(id),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps.all });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateAppPayload & { id: string }) =>
      updateApplication(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps.all });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps.all });
    },
  });
}
