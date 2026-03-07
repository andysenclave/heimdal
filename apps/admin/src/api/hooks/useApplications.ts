import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { Application } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

// Mock data for development when API is unavailable
const MOCK_APPS: Application[] = [
  {
    id: 'app_cuid001',
    orgId: 'org_cuid001',
    name: 'Trading Platform',
    appId: 'app_ck7f8x2m100003h6g9d1v4q8w',
    isActive: true,
    createdAt: '2025-11-15T10:00:00Z',
    updatedAt: '2026-02-20T14:30:00Z',
    _count: { roles: 5, permissions: 12, accessBindings: 34 },
  },
  {
    id: 'app_cuid002',
    orgId: 'org_cuid001',
    name: 'Portfolio Tracker',
    appId: 'app_ck9a2b4n700018j3k5m7p0r2x',
    isActive: true,
    createdAt: '2025-12-01T08:00:00Z',
    updatedAt: '2026-03-01T09:15:00Z',
    _count: { roles: 3, permissions: 8, accessBindings: 19 },
  },
  {
    id: 'app_cuid003',
    orgId: 'org_cuid002',
    name: 'Customer Portal',
    appId: 'app_cl1d3e5p900024l6n8q0s3u5y',
    isActive: true,
    createdAt: '2026-01-10T14:00:00Z',
    updatedAt: '2026-03-05T11:00:00Z',
    _count: { roles: 4, permissions: 10, accessBindings: 22 },
  },
  {
    id: 'app_cuid004',
    orgId: 'org_cuid002',
    name: 'Internal Admin',
    appId: 'app_cm3f4g6r100030m8p0s2u4w6z',
    isActive: false,
    createdAt: '2025-10-05T16:00:00Z',
    updatedAt: '2026-02-28T10:00:00Z',
    _count: { roles: 2, permissions: 6, accessBindings: 8 },
  },
  {
    id: 'app_cuid005',
    orgId: 'org_cuid005',
    name: 'Threat Monitor',
    appId: 'app_cn5h6j8t300036o0r2u4w6y8b',
    isActive: true,
    createdAt: '2025-10-20T12:00:00Z',
    updatedAt: '2026-03-06T16:45:00Z',
    _count: { roles: 7, permissions: 18, accessBindings: 45 },
  },
  {
    id: 'app_cuid006',
    orgId: 'org_cuid003',
    name: 'Lab Notebook',
    appId: 'app_cp7k8l0v500042q2t4w6y8a0d',
    isActive: true,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-03-07T08:30:00Z',
    _count: { roles: 2, permissions: 4, accessBindings: 6 },
  },
];

async function fetchApplications(): Promise<PaginatedResponse<Application>> {
  try {
    return await api
      .get('apps', { retry: 0, timeout: 5000 })
      .json<PaginatedResponse<Application>>();
  } catch {
    // Dev fallback
    if (import.meta.env.DEV) {
      return { data: MOCK_APPS, total: MOCK_APPS.length, page: 1, pageSize: 25 };
    }
    throw new Error('Failed to fetch applications');
  }
}

async function fetchApplication(id: string): Promise<Application> {
  try {
    return await api.get(`apps/${id}`, { retry: 0, timeout: 5000 }).json<Application>();
  } catch {
    if (import.meta.env.DEV) {
      const app = MOCK_APPS.find((a) => a.id === id);
      if (app) return app;
    }
    throw new Error('Application not found');
  }
}

export interface CreateAppPayload {
  name: string;
  orgId: string;
}

export interface UpdateAppPayload {
  name?: string;
  isActive?: boolean;
}

async function createApplication(payload: CreateAppPayload): Promise<Application> {
  try {
    return await api.post('apps', { json: payload }).json<Application>();
  } catch {
    if (import.meta.env.DEV) {
      const newApp: Application = {
        id: `app_${Date.now()}`,
        orgId: payload.orgId,
        name: payload.name,
        appId: `app_${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 10)}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { roles: 0, permissions: 0, accessBindings: 0 },
      };
      MOCK_APPS.push(newApp);
      return newApp;
    }
    throw new Error('Failed to create application');
  }
}

async function updateApplication(id: string, payload: UpdateAppPayload): Promise<Application> {
  try {
    return await api.patch(`apps/${id}`, { json: payload }).json<Application>();
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_APPS.findIndex((a) => a.id === id);
      if (idx >= 0) {
        MOCK_APPS[idx] = { ...MOCK_APPS[idx], ...payload, updatedAt: new Date().toISOString() };
        return MOCK_APPS[idx];
      }
    }
    throw new Error('Failed to update application');
  }
}

async function deleteApplication(id: string): Promise<void> {
  try {
    await api.delete(`apps/${id}`);
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_APPS.findIndex((a) => a.id === id);
      if (idx >= 0) MOCK_APPS.splice(idx, 1);
      return;
    }
    throw new Error('Failed to delete application');
  }
}

export function useApplications() {
  return useQuery({
    queryKey: queryKeys.apps.all,
    queryFn: fetchApplications,
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
