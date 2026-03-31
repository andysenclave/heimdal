/**
 * @heimdal/shared
 *
 * Shared types, constants, and utility functions used across
 * the Heimdal API and SDK packages.
 */

// --- Constants ---

export const HEIMDAL_ROLES = {
  PLATFORM_ADMIN: 'heimdal-admin',
  ORG_ADMIN: 'org-admin',
} as const;

export type HeimdalRole = (typeof HEIMDAL_ROLES)[keyof typeof HEIMDAL_ROLES];

export const API_VERSION = 'v1';
export const API_PREFIX = `api/${API_VERSION}`;

// --- Permission naming convention: domain:action ---

export const PERMISSION_PATTERN = /^[a-z]+:[a-z]+$/;

export function isValidPermission(key: string): boolean {
  return PERMISSION_PATTERN.test(key);
}

// --- ID prefixes ---

export const ID_PREFIXES = {
  user: 'user_',
  org: 'org_',
  app: 'app_',
  role: 'role_',
  perm: 'perm_',
  session: 'ses_',
  decision: 'dec_',
  token: 'tok_',
  binding: 'bind_',
} as const;

// --- Shared types ---

export interface GuardCheckRequest {
  resource: string;
  context?: Record<string, string>;
}

export interface GuardCheckResponse {
  allowed: boolean;
  user: {
    id: string;
    orgId: string;
    roles: string[];
  };
  matchedPermissions: string[];
  requiredPermissions?: string[];
  decisionId: string;
  resolvedAt: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  timestamp: string;
}

// --- JWT Claim types (locked contract) ---

export interface HeimdalJwtClaims {
  sub: string; // user ID
  iss: 'heimdal';
  aud: string; // app ID
  org: string; // org ID
  roles: string[];
  sessionId: string;
  exp: number;
  iat: number;
  jti: string; // token ID
}

// ─── Codex constants & types ─────────────────────────────

export const CODEX_ID_PREFIXES = {
  codexVersion: 'cxv_',
  codexScreen: 'cxs_',
  codexRegion: 'cxr_',
  codexContent: 'cxc_',
  codexLocale: 'cxl_',
} as const;

export const CODEX_VERSION_STATUS = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type CodexVersionStatus = (typeof CODEX_VERSION_STATUS)[keyof typeof CODEX_VERSION_STATUS];

export const CONTENT_TREE_RULES = {
  maxDepth: 3,
  maxScreens: 50,
  maxKeysPerScreen: 200,
  maxValueLength: 5000,
  keyPattern: /^[a-zA-Z][a-zA-Z0-9]*$/,
  reservedKeys: ['_meta', '_codex'] as string[],
  variablePattern: /\{\{[a-zA-Z][a-zA-Z0-9]*\}\}/,
} as const;

export interface CodexContentTree {
  [screenSlug: string]: {
    _meta?: CodexScreenMeta;
    [sectionKey: string]: string | { [elementKey: string]: string } | CodexScreenMeta | undefined;
  };
}

export interface CodexScreenMeta {
  screenType: string;
  aiConfidence: number;
  lastModified: string;
  translatedBy?: 'human' | 'ai';
  translationModel?: string;
}
