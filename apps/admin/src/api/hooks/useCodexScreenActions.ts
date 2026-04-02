import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';

async function uploadScreenshot(screenId: string, file: File): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`admin/codex/screens/${screenId}/upload`, { body: formData }).json();
}

async function analyzeScreen(screenId: string): Promise<{ regionCount: number }> {
  return api.post(`admin/codex/screens/${screenId}/analyze`).json();
}

export function useUploadScreenshot(screenId: string | null, versionId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadScreenshot(screenId!, file),
    onSuccess: () => {
      toast.success('Screenshot uploaded');
      if (versionId) queryClient.invalidateQueries({ queryKey: queryKeys.codex.screens(versionId) });
      if (screenId) queryClient.invalidateQueries({ queryKey: queryKeys.codex.screen(screenId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to upload screenshot');
    },
  });
}

export function useAnalyzeScreen(screenId: string | null, versionId: string | null, locale: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => analyzeScreen(screenId!),
    onSuccess: (result) => {
      toast.success(`Analysis complete: ${result.regionCount} regions detected`);
      if (screenId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.codex.regions(screenId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.codex.content(screenId, locale) });
      }
      if (versionId) queryClient.invalidateQueries({ queryKey: queryKeys.codex.screens(versionId) });
    },
    onError: () => {
      toast.error('AI analysis failed. Check API key configuration.');
    },
  });
}
