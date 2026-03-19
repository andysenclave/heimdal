export const queryKeys = {
  orgs: {
    all: ['orgs'] as const,
    detail: (id: string) => ['orgs', id] as const,
  },
  apps: {
    all: ['apps'] as const,
    detail: (id: string) => ['apps', id] as const,
    byOrg: (orgId: string) => ['apps', 'org', orgId] as const,
  },
  roles: {
    all: ['roles'] as const,
    byApp: (appId: string) => ['roles', 'app', appId] as const,
    detail: (id: string) => ['roles', id] as const,
  },
  permissions: {
    all: ['permissions', 'all'] as const,
    byApp: (appId: string) => ['permissions', 'app', appId] as const,
  },
  users: {
    byOrg: (orgId: string) => ['users', 'org', orgId] as const,
  },
  auditLog: {
    list: (filters?: Record<string, unknown>) => ['auditLog', filters] as const,
  },
  invites: {
    all: ['invites'] as const,
    byStatus: (status: string) => ['invites', 'status', status] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
};
