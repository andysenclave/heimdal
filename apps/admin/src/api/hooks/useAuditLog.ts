import { useQuery } from '@tanstack/react-query';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import type { AuditLogEntry } from '@/types/models';
import type { PaginatedResponse } from '@api/types';

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  actorId?: string;
}

async function fetchAuditLog(
  filters?: AuditLogFilters,
): Promise<PaginatedResponse<AuditLogEntry>> {
  try {
    const searchParams: Record<string, string> = {};
    if (filters?.action) searchParams['action'] = filters.action;
    if (filters?.resourceType) searchParams['resourceType'] = filters.resourceType;
    if (filters?.actorId) searchParams['actorId'] = filters.actorId;

    return await api
      .get('admin/audit/logs', { retry: 0, timeout: 5000, searchParams })
      .json<PaginatedResponse<AuditLogEntry>>();
  } catch {
    // Dev fallback
    if (import.meta.env.DEV) {
      let entries = MOCK_AUDIT_LOG;
      if (filters?.action) {
        const action = filters.action;
        entries = entries.filter((e) => e.action.includes(action));
      }
      if (filters?.resourceType) {
        const resourceType = filters.resourceType;
        entries = entries.filter((e) => e.resourceType === resourceType);
      }
      if (filters?.actorId) {
        const actorId = filters.actorId;
        entries = entries.filter((e) => e.actorId === actorId);
      }
      return { data: entries, total: entries.length, page: 1, pageSize: 50 };
    }
    throw new Error('Failed to fetch audit log');
  }
}

// Mock data for development when API is unavailable
const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'aud_001',
    orgId: 'org_cuid001',
    actorId: 'user_001',
    action: 'user.login',
    resourceType: 'session',
    resourceId: 'sess_abc123',
    metadata: { ip: '192.168.1.10', userAgent: 'Chrome/120' },
    createdAt: '2026-03-07T09:12:00Z',
    actor: {
      id: 'user_001',
      email: 'anna.berg@thimple.io',
      name: 'Anna Berg',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2026-03-07T09:12:00Z',
    },
  },
  {
    id: 'aud_002',
    orgId: 'org_cuid001',
    actorId: 'user_002',
    action: 'org.create',
    resourceType: 'organization',
    resourceId: 'org_cuid003',
    metadata: { name: 'Nexus Labs', plan: 'starter' },
    createdAt: '2026-03-07T08:45:00Z',
    actor: {
      id: 'user_002',
      email: 'karl.nilsson@thimple.io',
      name: 'Karl Nilsson',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-05T14:00:00Z',
      updatedAt: '2026-03-06T11:00:00Z',
    },
  },
  {
    id: 'aud_003',
    orgId: 'org_cuid001',
    actorId: 'user_001',
    action: 'role.assign',
    resourceType: 'access-binding',
    resourceId: 'ab_x9f21',
    metadata: { roleId: 'role_admin', userId: 'user_003' },
    createdAt: '2026-03-07T08:30:00Z',
    actor: {
      id: 'user_001',
      email: 'anna.berg@thimple.io',
      name: 'Anna Berg',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2026-03-07T09:12:00Z',
    },
  },
  {
    id: 'aud_004',
    orgId: 'org_cuid001',
    actorId: 'user_003',
    action: 'permission.grant',
    resourceType: 'role-permission',
    resourceId: 'rp_7k2m1',
    metadata: { permissionKey: 'portfolio:read', roleId: 'role_viewer' },
    createdAt: '2026-03-07T07:55:00Z',
    actor: {
      id: 'user_003',
      email: 'maja.ek@acme.com',
      name: 'Maja Ek',
      emailVerified: true,
      image: null,
      createdAt: '2025-12-10T08:00:00Z',
      updatedAt: '2026-03-05T16:00:00Z',
    },
  },
  {
    id: 'aud_005',
    orgId: 'org_cuid001',
    actorId: 'user_002',
    action: 'app.register',
    resourceType: 'application',
    resourceId: 'app_ck7f801',
    metadata: { appName: 'Trading Portal', appId: 'trading-portal' },
    createdAt: '2026-03-06T17:20:00Z',
    actor: {
      id: 'user_002',
      email: 'karl.nilsson@thimple.io',
      name: 'Karl Nilsson',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-05T14:00:00Z',
      updatedAt: '2026-03-06T11:00:00Z',
    },
  },
  {
    id: 'aud_006',
    orgId: 'org_cuid001',
    actorId: 'user_004',
    action: 'guard.check',
    resourceType: 'guard-decision',
    resourceId: 'gd_r8t42',
    metadata: { permission: 'trade:execute', allowed: true, latencyMs: 12 },
    createdAt: '2026-03-06T16:45:00Z',
    actor: {
      id: 'user_004',
      email: 'erik.lund@nexus.dev',
      name: 'Erik Lund',
      emailVerified: true,
      image: null,
      createdAt: '2026-01-05T14:00:00Z',
      updatedAt: '2026-03-06T16:45:00Z',
    },
  },
  {
    id: 'aud_007',
    orgId: 'org_cuid001',
    actorId: 'user_001',
    action: 'user.invite',
    resourceType: 'invitation',
    resourceId: 'inv_m3p91',
    metadata: { email: 'new.member@acme.com', role: 'member' },
    createdAt: '2026-03-06T15:10:00Z',
    actor: {
      id: 'user_001',
      email: 'anna.berg@thimple.io',
      name: 'Anna Berg',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2026-03-07T09:12:00Z',
    },
  },
  {
    id: 'aud_008',
    orgId: 'org_cuid001',
    actorId: 'user_003',
    action: 'role.update',
    resourceType: 'role',
    resourceId: 'role_editor',
    metadata: { field: 'name', from: 'Editor', to: 'Content Editor' },
    createdAt: '2026-03-06T14:30:00Z',
    actor: {
      id: 'user_003',
      email: 'maja.ek@acme.com',
      name: 'Maja Ek',
      emailVerified: true,
      image: null,
      createdAt: '2025-12-10T08:00:00Z',
      updatedAt: '2026-03-05T16:00:00Z',
    },
  },
  {
    id: 'aud_009',
    orgId: 'org_cuid001',
    actorId: 'user_002',
    action: 'org.settings.update',
    resourceType: 'organization',
    resourceId: 'org_cuid001',
    metadata: { field: 'plan', from: 'pro', to: 'enterprise' },
    createdAt: '2026-03-06T13:00:00Z',
    actor: {
      id: 'user_002',
      email: 'karl.nilsson@thimple.io',
      name: 'Karl Nilsson',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-05T14:00:00Z',
      updatedAt: '2026-03-06T11:00:00Z',
    },
  },
  {
    id: 'aud_010',
    orgId: 'org_cuid001',
    actorId: 'user_004',
    action: 'guard.check',
    resourceType: 'guard-decision',
    resourceId: 'gd_p2w85',
    metadata: { permission: 'admin:manage', allowed: false, latencyMs: 8 },
    createdAt: '2026-03-06T12:20:00Z',
    actor: {
      id: 'user_004',
      email: 'erik.lund@nexus.dev',
      name: 'Erik Lund',
      emailVerified: true,
      image: null,
      createdAt: '2026-01-05T14:00:00Z',
      updatedAt: '2026-03-06T16:45:00Z',
    },
  },
  {
    id: 'aud_011',
    orgId: 'org_cuid001',
    actorId: 'user_001',
    action: 'permission.revoke',
    resourceType: 'role-permission',
    resourceId: 'rp_3j8n2',
    metadata: { permissionKey: 'watchlist:manage', roleId: 'role_viewer' },
    createdAt: '2026-03-06T11:00:00Z',
    actor: {
      id: 'user_001',
      email: 'anna.berg@thimple.io',
      name: 'Anna Berg',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2026-03-07T09:12:00Z',
    },
  },
  {
    id: 'aud_012',
    orgId: 'org_cuid001',
    actorId: 'user_005',
    action: 'user.login',
    resourceType: 'session',
    resourceId: 'sess_def456',
    metadata: { ip: '10.0.0.42', userAgent: 'Firefox/130' },
    createdAt: '2026-03-06T10:15:00Z',
    actor: {
      id: 'user_005',
      email: 'sofia.dahl@ironclad.se',
      name: 'Sofia Dahl',
      emailVerified: true,
      image: null,
      createdAt: '2025-10-15T12:00:00Z',
      updatedAt: '2026-03-06T10:15:00Z',
    },
  },
  {
    id: 'aud_013',
    orgId: 'org_cuid001',
    actorId: 'user_002',
    action: 'role.create',
    resourceType: 'role',
    resourceId: 'role_analyst',
    metadata: { name: 'Analyst', parentRoleId: 'role_member' },
    createdAt: '2026-03-05T16:40:00Z',
    actor: {
      id: 'user_002',
      email: 'karl.nilsson@thimple.io',
      name: 'Karl Nilsson',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-05T14:00:00Z',
      updatedAt: '2026-03-06T11:00:00Z',
    },
  },
  {
    id: 'aud_014',
    orgId: 'org_cuid001',
    actorId: 'user_003',
    action: 'app.delete',
    resourceType: 'application',
    resourceId: 'app_old789',
    metadata: { appName: 'Legacy Dashboard' },
    createdAt: '2026-03-05T15:00:00Z',
    actor: {
      id: 'user_003',
      email: 'maja.ek@acme.com',
      name: 'Maja Ek',
      emailVerified: true,
      image: null,
      createdAt: '2025-12-10T08:00:00Z',
      updatedAt: '2026-03-05T16:00:00Z',
    },
  },
  {
    id: 'aud_015',
    orgId: 'org_cuid001',
    actorId: 'user_001',
    action: 'permission.create',
    resourceType: 'permission',
    resourceId: 'perm_trd01',
    metadata: { key: 'trade:execute', description: 'Execute trades' },
    createdAt: '2026-03-05T14:20:00Z',
    actor: {
      id: 'user_001',
      email: 'anna.berg@thimple.io',
      name: 'Anna Berg',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2026-03-07T09:12:00Z',
    },
  },
  {
    id: 'aud_016',
    orgId: 'org_cuid001',
    actorId: 'user_005',
    action: 'guard.check',
    resourceType: 'guard-decision',
    resourceId: 'gd_k9v33',
    metadata: { permission: 'portfolio:read', allowed: true, latencyMs: 5 },
    createdAt: '2026-03-05T13:10:00Z',
    actor: {
      id: 'user_005',
      email: 'sofia.dahl@ironclad.se',
      name: 'Sofia Dahl',
      emailVerified: true,
      image: null,
      createdAt: '2025-10-15T12:00:00Z',
      updatedAt: '2026-03-06T10:15:00Z',
    },
  },
  {
    id: 'aud_017',
    orgId: 'org_cuid001',
    actorId: 'user_004',
    action: 'user.login',
    resourceType: 'session',
    resourceId: 'sess_ghi789',
    metadata: { ip: '172.16.0.5', userAgent: 'Safari/17' },
    createdAt: '2026-03-05T11:30:00Z',
    actor: {
      id: 'user_004',
      email: 'erik.lund@nexus.dev',
      name: 'Erik Lund',
      emailVerified: true,
      image: null,
      createdAt: '2026-01-05T14:00:00Z',
      updatedAt: '2026-03-06T16:45:00Z',
    },
  },
  {
    id: 'aud_018',
    orgId: 'org_cuid001',
    actorId: 'user_001',
    action: 'role.assign',
    resourceType: 'access-binding',
    resourceId: 'ab_t5h77',
    metadata: { roleId: 'role_analyst', userId: 'user_005' },
    createdAt: '2026-03-05T10:00:00Z',
    actor: {
      id: 'user_001',
      email: 'anna.berg@thimple.io',
      name: 'Anna Berg',
      emailVerified: true,
      image: null,
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2026-03-07T09:12:00Z',
    },
  },
];

export function useAuditLog(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: queryKeys.auditLog.list(filters as Record<string, unknown> | undefined),
    queryFn: () => fetchAuditLog(filters),
  });
}
