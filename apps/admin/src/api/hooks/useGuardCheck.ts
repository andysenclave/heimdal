import { useMutation } from '@tanstack/react-query';
import { api } from '@api/client';

export interface GuardCheckPayload {
  userId: string;
  appId: string;
  permission: string;
  resource?: string;
}

export interface GuardCheckResult {
  allowed: boolean;
  resolvedRoles: string[];
  matchedPermissions: string[];
  evaluationMs: number;
}

async function checkGuard(payload: GuardCheckPayload): Promise<GuardCheckResult> {
  return api
    .post('guard/check', { json: payload, retry: 0, timeout: 10000 })
    .json<GuardCheckResult>();
}

export function useGuardCheck() {
  return useMutation({
    mutationFn: checkGuard,
  });
}
