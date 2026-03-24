import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { Invite, InviteValidation } from '@/types/models';

export interface CreateInvitePayload {
  email: string;
  orgId?: string;        // omit for Heimdal Admin invites
  orgRole?: 'admin' | 'member';
  appId?: string;        // required when orgRole === 'member'
}

async function fetchInvites(orgId?: string, status?: string): Promise<Invite[]> {
  const searchParams: Record<string, string> = {};
  if (orgId) searchParams.orgId = orgId;
  if (status) searchParams.status = status;
  return api
    .get('admin/invites', {
      searchParams: Object.keys(searchParams).length ? searchParams : undefined,
    })
    .json<Invite[]>();
}

async function createInvite(payload: CreateInvitePayload): Promise<Invite> {
  return api.post('admin/invites', { json: payload }).json<Invite>();
}

async function revokeInvite(id: string): Promise<void> {
  await api.delete(`admin/invites/${id}`);
}

export async function validateInviteCode(code: string): Promise<InviteValidation> {
  return api.get(`auth/invites/${code}/validate`).json<InviteValidation>();
}

export function useInvites(orgId?: string, status?: string) {
  const key = orgId
    ? status
      ? queryKeys.invites.byOrgStatus(orgId, status)
      : queryKeys.invites.byOrg(orgId)
    : status
      ? queryKeys.invites.byStatus(status)
      : queryKeys.invites.all;

  return useQuery({
    queryKey: key,
    queryFn: () => fetchInvites(orgId, status),
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });
}
