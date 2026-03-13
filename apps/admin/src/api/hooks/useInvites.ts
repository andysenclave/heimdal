import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { Invite, InviteValidation } from '@/types/models';

async function fetchInvites(status?: string): Promise<Invite[]> {
  const searchParams = status ? { status } : undefined;
  return api.get('admin/invites', { searchParams }).json<Invite[]>();
}

async function createInvite(email: string): Promise<Invite> {
  return api.post('admin/invites', { json: { email } }).json<Invite>();
}

async function revokeInvite(id: string): Promise<void> {
  await api.delete(`admin/invites/${id}`);
}

export async function validateInviteCode(code: string): Promise<InviteValidation> {
  return api.get(`auth/invites/${code}/validate`).json<InviteValidation>();
}

export function useInvites(status?: string) {
  return useQuery({
    queryKey: status ? queryKeys.invites.byStatus(status) : queryKeys.invites.all,
    queryFn: () => fetchInvites(status),
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites.all });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites.all });
    },
  });
}
