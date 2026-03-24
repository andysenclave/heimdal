export const ROUTES = {
  DASHBOARD: '/',
  ORGANIZATIONS: '/organizations',
  USERS: '/users',
  APPLICATIONS: '/applications',
  ROLES: '/roles',
  PERMISSIONS: '/permissions',
  GUARD_TESTER: '/guard-tester',
  AUDIT_LOG: '/audit-log',
  PROFILE: '/profile',
  LOGIN: '/login',
} as const;

export const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, icon: '◈', label: 'Dashboard' },
  { path: ROUTES.ORGANIZATIONS, icon: '◇', label: 'Organizations' },
  { path: ROUTES.USERS, icon: '⊕', label: 'Users' },
  { path: ROUTES.APPLICATIONS, icon: '⬡', label: 'Applications' },
  { path: ROUTES.ROLES, icon: '△', label: 'Roles' },
  { path: ROUTES.PERMISSIONS, icon: '◆', label: 'Permissions' },
  { path: ROUTES.GUARD_TESTER, icon: '⊡', label: 'Guard Tester' },
  { path: ROUTES.AUDIT_LOG, icon: '≡', label: 'Audit Log' },
  { path: ROUTES.PROFILE, icon: '○', label: 'Profile' },
] as const;

export const APP_NAME = 'Heimdal';
export const APP_SUBTITLE = 'ADMIN · PANEL';
