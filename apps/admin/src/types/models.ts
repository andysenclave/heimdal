export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: {
    applications: number;
    memberships: number;
  };
}

export interface Application {
  id: string;
  orgId: string;
  name: string;
  appId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    roles: number;
    permissions: number;
    accessBindings: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMembership {
  userId: string;
  orgId: string;
  role: 'owner' | 'admin' | 'member';
  user: User;
  createdAt: string;
}

export interface Role {
  id: string;
  orgId: string;
  appId: string;
  name: string;
  parentRoleId: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  parentRole?: Role | null;
  childRoles?: Role[];
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  orgId: string;
  appId: string;
  key: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  orgId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor?: User;
}

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
}
