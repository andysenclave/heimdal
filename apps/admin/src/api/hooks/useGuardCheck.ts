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

const MOCK_ROLES = [
  'org-admin',
  'app-admin',
  'viewer',
  'editor',
  'member',
  'super-admin',
  'analyst',
  'auditor',
];

const MOCK_PERMISSIONS = [
  'portfolio:read',
  'portfolio:write',
  'trade:execute',
  'trade:read',
  'watchlist:manage',
  'user:read',
  'user:manage',
  'report:generate',
  'settings:manage',
  'audit:read',
];

function pickRandom<T>(items: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function simulateGuardCheck(payload: GuardCheckPayload): Promise<GuardCheckResult> {
  const delay = Math.floor(Math.random() * 13) + 3; // 3-15ms
  return new Promise((resolve) => {
    setTimeout(() => {
      const allowed = Math.random() < 0.8;
      const resolvedRoles = pickRandom(MOCK_ROLES, 1, 3);
      const matchedPermissions = allowed
        ? [payload.permission, ...pickRandom(MOCK_PERMISSIONS.filter((p) => p !== payload.permission), 0, 2)]
        : [];

      resolve({
        allowed,
        resolvedRoles,
        matchedPermissions,
        evaluationMs: delay,
      });
    }, delay + 200); // Add 200ms to simulate network latency
  });
}

async function checkGuard(payload: GuardCheckPayload): Promise<GuardCheckResult> {
  try {
    return await api
      .post('guard/check', { json: payload, retry: 0, timeout: 10000 })
      .json<GuardCheckResult>();
  } catch {
    if (import.meta.env.DEV) {
      return simulateGuardCheck(payload);
    }
    throw new Error('Guard check failed');
  }
}

export function useGuardCheck() {
  return useMutation({
    mutationFn: checkGuard,
  });
}
