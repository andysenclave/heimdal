import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { Organization } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

// Mock data for development when API is unavailable
const MOCK_ORGS: Organization[] = [
  {
    id: 'org_cuid001',
    name: 'Thimple',
    slug: 'thimple',
    plan: 'enterprise',
    isActive: true,
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2026-02-15T14:30:00Z',
    deletedAt: null,
    _count: { applications: 3, memberships: 12 },
  },
  {
    id: 'org_cuid002',
    name: 'Acme Corp',
    slug: 'acme-corp',
    plan: 'pro',
    isActive: true,
    createdAt: '2025-12-10T08:00:00Z',
    updatedAt: '2026-01-20T09:15:00Z',
    deletedAt: null,
    _count: { applications: 2, memberships: 8 },
  },
  {
    id: 'org_cuid003',
    name: 'Nexus Labs',
    slug: 'nexus-labs',
    plan: 'starter',
    isActive: true,
    createdAt: '2026-01-05T14:00:00Z',
    updatedAt: '2026-03-01T11:00:00Z',
    deletedAt: null,
    _count: { applications: 1, memberships: 3 },
  },
  {
    id: 'org_cuid004',
    name: 'Sunset Digital',
    slug: 'sunset-digital',
    plan: 'pro',
    isActive: false,
    createdAt: '2025-09-20T16:00:00Z',
    updatedAt: '2026-02-28T10:00:00Z',
    deletedAt: null,
    _count: { applications: 4, memberships: 15 },
  },
  {
    id: 'org_cuid005',
    name: 'Ironclad Security',
    slug: 'ironclad-security',
    plan: 'enterprise',
    isActive: true,
    createdAt: '2025-10-15T12:00:00Z',
    updatedAt: '2026-03-05T16:45:00Z',
    deletedAt: null,
    _count: { applications: 6, memberships: 24 },
  },
  {
    id: 'org_cuid006',
    name: 'PixelForge',
    slug: 'pixelforge',
    plan: null,
    isActive: true,
    createdAt: '2026-02-20T09:00:00Z',
    updatedAt: '2026-03-06T08:30:00Z',
    deletedAt: null,
    _count: { applications: 0, memberships: 1 },
  },
];

async function fetchOrganizations(): Promise<PaginatedResponse<Organization>> {
  try {
    return await api.get('orgs', { retry: 0, timeout: 5000 }).json<PaginatedResponse<Organization>>();
  } catch {
    // Dev fallback
    if (import.meta.env.DEV) {
      return { data: MOCK_ORGS, total: MOCK_ORGS.length, page: 1, pageSize: 25 };
    }
    throw new Error('Failed to fetch organizations');
  }
}

async function fetchOrganization(id: string): Promise<Organization> {
  try {
    return await api.get(`orgs/${id}`, { retry: 0, timeout: 5000 }).json<Organization>();
  } catch {
    if (import.meta.env.DEV) {
      const org = MOCK_ORGS.find((o) => o.id === id);
      if (org) return org;
    }
    throw new Error('Organization not found');
  }
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
  try {
    return await api.post('orgs', { json: payload }).json<Organization>();
  } catch {
    if (import.meta.env.DEV) {
      const newOrg: Organization = {
        id: `org_${Date.now()}`,
        name: payload.name,
        slug: payload.slug,
        plan: payload.plan ?? null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        _count: { applications: 0, memberships: 0 },
      };
      MOCK_ORGS.push(newOrg);
      return newOrg;
    }
    throw new Error('Failed to create organization');
  }
}

async function updateOrganization(id: string, payload: UpdateOrgPayload): Promise<Organization> {
  try {
    return await api.patch(`orgs/${id}`, { json: payload }).json<Organization>();
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_ORGS.findIndex((o) => o.id === id);
      if (idx >= 0) {
        MOCK_ORGS[idx] = { ...MOCK_ORGS[idx], ...payload, updatedAt: new Date().toISOString() };
        return MOCK_ORGS[idx];
      }
    }
    throw new Error('Failed to update organization');
  }
}

async function deleteOrganization(id: string): Promise<void> {
  try {
    await api.delete(`orgs/${id}`);
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_ORGS.findIndex((o) => o.id === id);
      if (idx >= 0) MOCK_ORGS.splice(idx, 1);
      return;
    }
    throw new Error('Failed to delete organization');
  }
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
