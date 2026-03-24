export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  isActive: boolean;
  isSystem?: boolean;
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

export interface OrgMembershipApp {
  id: string;
  name: string;
  appId: string;
}

export interface OrgMembership {
  userId: string;
  orgId: string;
  appId: string | null;
  apps: OrgMembershipApp[];
  role: 'owner' | 'admin' | 'member';
  user: User;
  createdAt: string;
}

export interface Role {
  id: string;
  orgId: string;
  appId: string;
  name: string;
  baseRoleId: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  baseRole?: Role | null;
  derivedRoles?: Role[];
  permissions?: Permission[];
  _count?: {
    rolePermissions: number;
    userAppRoles: number;
    derivedRoles?: number;
  };
  rolePermissions?: { permission: Permission }[];
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

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Invite {
  id: string;
  code: string;
  email: string;
  orgId: string | null;
  orgRole: 'owner' | 'admin' | 'member';
  appId: string | null;
  status: InviteStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  org: { id: string; name: string } | null;
  app: { id: string; name: string; appId: string } | null;
  invitedBy: {
    id: string;
    email: string;
    name: string | null;
  };
  acceptedBy: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export interface InviteValidation {
  valid: boolean;
  email?: string;
  expiresAt?: string;
}

export interface AppUserRole {
  id: string;
  name: string;
}

export interface AppUser {
  id: string;           // AppMembership.id
  userId: string;
  appId: string;        // Application.id (internal)
  user: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
    createdAt: string;
  };
  roles: AppUserRole[];
  createdAt: string;
}

export interface AppUsersResponse {
  data: AppUser[];
  total: number;
}
