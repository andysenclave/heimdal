import { useQuery } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { CodexScreen } from '@api/codex-types';

async function fetchScreen(screenId: string): Promise<CodexScreen> {
  return api.get(`admin/codex/screens/${screenId}`).json();
}

export function useCodexScreen(screenId: string | null) {
  return useQuery({
    queryKey: queryKeys.codex.screen(screenId ?? ''),
    queryFn: () => fetchScreen(screenId!),
    enabled: !!screenId,
  });
}
