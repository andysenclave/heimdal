import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { CodexLocale } from '@api/codex-types';

export interface CreateLocalePayload {
  locale: string;
  name: string;
  isBase?: boolean;
}

async function fetchLocales(appId: string): Promise<CodexLocale[]> {
  return api.get(`admin/apps/${appId}/codex/locales`).json();
}

async function createLocale(appId: string, payload: CreateLocalePayload): Promise<CodexLocale> {
  return api.post(`admin/apps/${appId}/codex/locales`, { json: payload }).json();
}

async function deleteLocale(localeId: string): Promise<void> {
  await api.delete(`admin/codex/locales/${localeId}`);
}

export function useCodexLocales(appId: string | null) {
  return useQuery({
    queryKey: queryKeys.codex.locales(appId ?? ''),
    queryFn: () => fetchLocales(appId!),
    enabled: !!appId,
  });
}

export function useCreateCodexLocale(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocalePayload) => createLocale(appId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.locales(appId) });
    },
    onError: () => toast.error('Failed to add language'),
  });
}

export function useDeleteCodexLocale(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLocale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.locales(appId) });
    },
    onError: () => toast.error('Failed to delete language'),
  });
}
