import type { HeimdalRole } from '@heimdal/shared';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

/** Minimum app reference returned in session / stored in AppContext */
export interface AppRef {
  id: string;
  name: string;
  appId: string;
}

// Shape returned by GET /api/v1/auth/session
export interface SessionResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
    isHeimdalAdmin: boolean;
    createdAt: string;
  };
  session: {
    id: string;
    orgId: string;
    aud: string;
    roles: string[];
    expiresAt: string;
  };
  systemRole: HeimdalRole;
  org: {
    id: string;
    name: string;
    slug: string;
  } | null;
  /** Non-null only for org members whose OrgMembership.appId is set */
  boundApp: AppRef | null;
}

// Flat user shape used throughout the admin UI
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  orgId: string;
  roles: string[];
  systemRole: HeimdalRole;
  isHeimdalAdmin: boolean;
  /** The user's OrgMembership role within their bound org: owner | admin | member */
  orgMembershipRole: 'owner' | 'admin' | 'member';
  org: {
    id: string;
    name: string;
    slug: string;
  } | null;
  /** Non-null only for org members. Used to auto-bind their app in AppContext. */
  boundApp: AppRef | null;
}

// Shape returned by POST /api/v1/auth/login and /auth/signup
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    orgId: string;
  };
  sessionId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
