import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { CodexScreen } from '@api/codex-types';

export interface CreateScreenPayload {
  name: string;
  slug: string;
  description?: string;
}

async function fetchScreens(versionId: string): Promise<CodexScreen[]> {
  return api.get(`admin/codex/versions/${versionId}/screens`).json();
}

async function createScreen(versionId: string, payload: CreateScreenPayload): Promise<CodexScreen> {
  return api.post(`admin/codex/versions/${versionId}/screens`, { json: payload }).json();
}

async function deleteScreen(screenId: string): Promise<void> {
  await api.delete(`admin/codex/screens/${screenId}`);
}

async function reorderScreens(versionId: string, screenIds: string[]): Promise<void> {
  await api.patch(`admin/codex/versions/${versionId}/screens/reorder`, { json: { screenIds } });
}

export function useCodexScreens(versionId: string | null) {
  return useQuery({
    queryKey: queryKeys.codex.screens(versionId ?? ''),
    queryFn: () => fetchScreens(versionId!),
    enabled: !!versionId,
  });
}

export function useCreateCodexScreen(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateScreenPayload) => createScreen(versionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.screens(versionId) });
      toast.success('Screen created');
    },
    onError: () => toast.error('Failed to create screen'),
  });
}

export function useDeleteCodexScreen(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteScreen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.screens(versionId) });
      toast.success('Screen deleted');
    },
    onError: () => toast.error('Failed to delete screen'),
  });
}

export function useReorderCodexScreens(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (screenIds: string[]) => reorderScreens(versionId, screenIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.screens(versionId) });
    },
    onError: () => toast.error('Failed to reorder screens'),
  });
}
