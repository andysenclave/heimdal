import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@api/client';
import { queryKeys } from '@lib/query-keys';
import type { CodexVersion } from '@api/codex-types';

async function submitForReview(versionId: string, notes?: string): Promise<CodexVersion> {
  return api.post(`admin/codex/versions/${versionId}/submit`, { json: { notes } }).json();
}

async function approveVersion(versionId: string): Promise<CodexVersion> {
  return api.post(`admin/codex/versions/${versionId}/approve`).json();
}

async function rejectVersion(versionId: string, feedback: string): Promise<CodexVersion> {
  return api.post(`admin/codex/versions/${versionId}/reject`, { json: { decision: 'reject', feedback } }).json();
}

async function rollbackVersion(versionId: string): Promise<CodexVersion> {
  return api.post(`admin/codex/versions/${versionId}/rollback`).json();
}

export function useSubmitForReview(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, notes }: { versionId: string; notes?: string }) =>
      submitForReview(versionId, notes),
    onSuccess: (_, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.versions(appId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.version(versionId) });
    },
    onError: () => toast.error('Failed to submit version for review'),
  });
}

export function useApproveVersion(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveVersion,
    onSuccess: (_, versionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.versions(appId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.version(versionId) });
    },
    onError: () => toast.error('Failed to approve version'),
  });
}

export function useRejectVersion(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, feedback }: { versionId: string; feedback: string }) =>
      rejectVersion(versionId, feedback),
    onSuccess: (_, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.versions(appId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.version(versionId) });
    },
    onError: () => toast.error('Failed to reject version'),
  });
}

export function useRollbackVersion(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rollbackVersion,
    onSuccess: (_, versionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.versions(appId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.codex.version(versionId) });
    },
    onError: () => toast.error('Failed to rollback version'),
  });
}
