import { useQuery } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { CodexVersion } from '@api/codex-types';

async function fetchVersion(versionId: string): Promise<CodexVersion> {
  return api.get(`admin/codex/versions/${versionId}`).json();
}

export function useCodexVersion(versionId: string | null) {
  return useQuery({
    queryKey: queryKeys.codex.version(versionId ?? ''),
    queryFn: () => fetchVersion(versionId!),
    enabled: !!versionId,
  });
}
