import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { CodexContent } from '@api/codex-types';

async function fetchContent(screenId: string, locale: string): Promise<CodexContent> {
  return api.get(`admin/codex/screens/${screenId}/content`, { searchParams: { locale } }).json();
}

async function updateContent(screenId: string, locale: string, contentTree: Record<string, unknown>): Promise<CodexContent> {
  return api.put(`admin/codex/screens/${screenId}/content`, { json: { locale, contentTree } }).json();
}

export function useCodexContent(screenId: string | null, locale: string) {
  return useQuery({
    queryKey: queryKeys.codex.content(screenId ?? '', locale),
    queryFn: () => fetchContent(screenId!, locale),
    enabled: !!screenId && !!locale,
  });
}

export function useUpdateCodexContent(screenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ locale, contentTree }: { locale: string; contentTree: Record<string, unknown> }) =>
      updateContent(screenId, locale, contentTree),
    onSuccess: (_, { locale }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.content(screenId, locale) });
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.screen(screenId) });
    },
  });
}
