import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { CodexRegion } from '@api/codex-types';

async function fetchRegions(screenId: string): Promise<CodexRegion[]> {
  return api.get(`admin/codex/screens/${screenId}/regions`).json();
}

async function confirmRegion(regionId: string): Promise<CodexRegion> {
  return api.patch(`admin/codex/regions/${regionId}`, { json: { isConfirmed: true } }).json();
}

async function ignoreRegion(regionId: string): Promise<CodexRegion> {
  return api.patch(`admin/codex/regions/${regionId}`, { json: { isIgnored: true } }).json();
}

export function useCodexRegions(screenId: string | null) {
  return useQuery({
    queryKey: queryKeys.codex.regions(screenId ?? ''),
    queryFn: () => fetchRegions(screenId!),
    enabled: !!screenId,
  });
}

export function useConfirmRegion(screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.regions(screenId) });
    },
  });
}

export function useIgnoreRegion(screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ignoreRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.regions(screenId) });
    },
  });
}
