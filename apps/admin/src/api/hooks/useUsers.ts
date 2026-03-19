import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { OrgMembership } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

const MOCK_MEMBERS: OrgMembership[] = [
  {
    userId: 'user_001',
    orgId: 'org_cuid001',
    role: 'owner',
    createdAt: '2025-11-01T10:00:00Z',
    user: {
      id: 'user_001',
      email: 'admin@thimple.dev',
      name: 'Sarah Chen',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2026-03-05T14:00:00Z',
    },
  },
  {
    userId: 'user_002',
    orgId: 'org_cuid001',
    role: 'admin',
    createdAt: '2025-11-05T08:00:00Z',
    user: {
      id: 'user_002',
      email: 'james.wilson@thimple.dev',
      name: 'James Wilson',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-05T08:00:00Z',
      updatedAt: '2026-02-20T11:00:00Z',
    },
  },
  {
    userId: 'user_003',
    orgId: 'org_cuid001',
    role: 'member',
    createdAt: '2025-12-01T14:00:00Z',
    user: {
      id: 'user_003',
      email: 'alex.kim@thimple.dev',
      name: 'Alex Kim',
      emailVerified: true,
      image: null,
      createdAt: '2025-12-01T14:00:00Z',
      updatedAt: '2026-01-15T09:00:00Z',
    },
  },
  {
    userId: 'user_004',
    orgId: 'org_cuid001',
    role: 'member',
    createdAt: '2026-01-10T09:00:00Z',
    user: {
      id: 'user_004',
      email: 'priya.sharma@thimple.dev',
      name: 'Priya Sharma',
      emailVerified: true,
      image: null,
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-03-01T16:00:00Z',
    },
  },
  {
    userId: 'user_005',
    orgId: 'org_cuid001',
    role: 'member',
    createdAt: '2026-01-20T11:00:00Z',
    user: {
      id: 'user_005',
      email: 'marcus.lee@thimple.dev',
      name: 'Marcus Lee',
      emailVerified: false,
      image: null,
      createdAt: '2026-01-20T11:00:00Z',
      updatedAt: '2026-01-20T11:00:00Z',
    },
  },
  {
    userId: 'user_006',
    orgId: 'org_cuid001',
    role: 'admin',
    createdAt: '2026-02-05T15:00:00Z',
    user: {
      id: 'user_006',
      email: 'emma.torres@thimple.dev',
      name: 'Emma Torres',
      emailVerified: true,
      image: null,
      createdAt: '2026-02-05T15:00:00Z',
      updatedAt: '2026-03-06T10:00:00Z',
    },
  },
  {
    userId: 'user_007',
    orgId: 'org_cuid001',
    role: 'member',
    createdAt: '2026-02-15T12:00:00Z',
    user: {
      id: 'user_007',
      email: 'david.nakamura@thimple.dev',
      name: null,
      emailVerified: true,
      image: null,
      createdAt: '2026-02-15T12:00:00Z',
      updatedAt: '2026-02-15T12:00:00Z',
    },
  },
];

async function fetchMembers(orgId: string): Promise<PaginatedResponse<OrgMembership>> {
  try {
    return await api
      .get(`orgs/${orgId}/members`, { retry: 0, timeout: 5000 })
      .json<PaginatedResponse<OrgMembership>>();
  } catch {
    if (import.meta.env.DEV) {
      const members = MOCK_MEMBERS.filter((m) => m.orgId === orgId || orgId === 'all');
      return { data: members, total: members.length, page: 1, pageSize: 50 };
    }
    throw new Error('Failed to fetch members');
  }
}

export interface InviteMemberPayload {
  email: string;
  role: 'admin' | 'member';
  orgId: string;
}

export interface UpdateMemberPayload {
  role: 'owner' | 'admin' | 'member';
}

async function inviteMember(payload: InviteMemberPayload): Promise<OrgMembership> {
  try {
    return await api
      .post(`orgs/${payload.orgId}/members`, { json: payload })
      .json<OrgMembership>();
  } catch {
    if (import.meta.env.DEV) {
      const member: OrgMembership = {
        userId: `user_${Date.now()}`,
        orgId: payload.orgId,
        role: payload.role,
        createdAt: new Date().toISOString(),
        user: {
          id: `user_${Date.now()}`,
          email: payload.email,
          name: null,
          emailVerified: false,
          image: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      MOCK_MEMBERS.push(member);
      return member;
    }
    throw new Error('Failed to invite member');
  }
}

async function updateMemberRole(
  orgId: string,
  userId: string,
  payload: UpdateMemberPayload,
): Promise<OrgMembership> {
  try {
    return await api
      .patch(`orgs/${orgId}/members/${userId}`, { json: payload })
      .json<OrgMembership>();
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_MEMBERS.findIndex((m) => m.userId === userId);
      if (idx >= 0) {
        MOCK_MEMBERS[idx] = { ...MOCK_MEMBERS[idx], role: payload.role };
        return MOCK_MEMBERS[idx];
      }
    }
    throw new Error('Failed to update member');
  }
}

async function removeMember(orgId: string, userId: string): Promise<void> {
  try {
    await api.delete(`orgs/${orgId}/members/${userId}`);
  } catch {
    if (import.meta.env.DEV) {
      const idx = MOCK_MEMBERS.findIndex((m) => m.userId === userId);
      if (idx >= 0) MOCK_MEMBERS.splice(idx, 1);
      return;
    }
    throw new Error('Failed to remove member');
  }
}

export function useMembers(orgId: string) {
  return useQuery({
    queryKey: queryKeys.users.byOrg(orgId),
    queryFn: () => fetchMembers(orgId),
    enabled: !!orgId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orgId,
      userId,
      ...payload
    }: UpdateMemberPayload & { orgId: string; userId: string }) =>
      updateMemberRole(orgId, userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      removeMember(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useTransferOwnership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, toUserId }: { orgId: string; toUserId: string }) => {
      await api.post(`orgs/${orgId}/transfer-ownership`, { json: { toUserId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
