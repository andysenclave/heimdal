import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { OrgMembership } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

async function fetchMembers(orgId: string): Promise<PaginatedResponse<OrgMembership>> {
  return api
    .get(`admin/orgs/${orgId}/members`, { retry: 0, timeout: 5000 })
    .json<PaginatedResponse<OrgMembership>>();
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
  return api
    .post(`admin/orgs/${payload.orgId}/members`, { json: payload })
    .json<OrgMembership>();
}

async function updateMemberRole(
  orgId: string,
  userId: string,
  payload: UpdateMemberPayload,
): Promise<OrgMembership> {
  return api
    .patch(`admin/orgs/${orgId}/members/${userId}`, { json: payload })
    .json<OrgMembership>();
}

async function removeMember(orgId: string, userId: string): Promise<void> {
  await api.delete(`admin/orgs/${orgId}/members/${userId}`);
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
      await api.post(`admin/orgs/${orgId}/transfer-ownership`, { json: { toUserId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
