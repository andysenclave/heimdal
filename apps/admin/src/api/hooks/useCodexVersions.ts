import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { CodexVersion } from '@api/codex-types';

export interface CreateVersionPayload {
  description?: string;
  cloneFromLatest?: boolean;
}

async function fetchVersions(appId: string): Promise<{ data: CodexVersion[]; total: number }> {
  return api.get(`admin/apps/${appId}/codex/versions`).json();
}

async function createVersion(appId: string, payload: CreateVersionPayload): Promise<CodexVersion> {
  return api.post(`admin/apps/${appId}/codex/versions`, { json: payload }).json();
}

async function deleteVersion(versionId: string): Promise<void> {
  await api.delete(`admin/codex/versions/${versionId}`);
}

export function useCodexVersions(appId: string | null) {
  return useQuery({
    queryKey: queryKeys.codex.versions(appId ?? ''),
    queryFn: () => fetchVersions(appId!),
    enabled: !!appId,
  });
}

export function useCreateCodexVersion(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVersionPayload) => createVersion(appId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.versions(appId) });
    },
    onError: () => toast.error('Failed to create version'),
  });
}

export function useDeleteCodexVersion(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.versions(appId) });
    },
    onError: () => toast.error('Failed to delete version'),
  });
}
