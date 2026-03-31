import { HEIMDAL_ROLES } from '@heimdal/shared';
import type { HeimdalRole } from '@heimdal/shared';
import { useSession } from './useSession';

/**
 * Returns true if the current user has the required system role.
 * Platform admins pass all role gates.
 */
export function useRoleGate(requiredRole: HeimdalRole): boolean {
  const { systemRole } = useSession();
  if (!systemRole) return false;
  if (systemRole === HEIMDAL_ROLES.PLATFORM_ADMIN) return true;
  return systemRole === requiredRole;
}

/**
 * Returns feature-access flags based on the current user's system role.
 * Use this in components to conditionally render UI elements.
 */
export function useFeatureAccess() {
  const { isPlatformAdmin, isOrgMember } = useSession();

  // Org members: Roles + Permissions pages only.
  // They can create/edit roles & permissions and manage role-permission mappings,
  // but cannot delete anything (destructive ops are org-admin only).
  if (isOrgMember) {
    return {
      canSeeOrganizations: false,
      canSeeOrgSelector: false,
      canCreateOrg: false,
      canDeleteOrg: false,
      canInviteOrgAdmin: false,
      canSeeAllOrgs: false,
      canSeeUsers: false,
      canSeeApplications: false,
      canSeeRoles: true,
      canSeePermissions: true,
      canSeeInvites: false,
      canSeeGuardTester: false,
      canSeeAuditLog: false,
      canSeeDashboard: false,
      canSeeCodex: false,
      // Roles
      canWriteRoles: true,
      canDeleteRoles: false,
      // Permissions
      canWritePermissions: true,
      canDeletePermissions: false,
    };
  }

  return {
    canSeeOrganizations: isPlatformAdmin,
    canSeeOrgSelector: isPlatformAdmin,
    canCreateOrg: isPlatformAdmin,
    canDeleteOrg: isPlatformAdmin,
    canInviteOrgAdmin: isPlatformAdmin,
    canSeeAllOrgs: isPlatformAdmin,
    canSeeUsers: true,
    canSeeApplications: true,
    canSeeRoles: true,
    canSeePermissions: true,
    canSeeInvites: true,
    canSeeGuardTester: true,
    canSeeAuditLog: isPlatformAdmin,
    canSeeDashboard: true,
    canSeeCodex: true,
    // Roles
    canWriteRoles: true,
    canDeleteRoles: true,
    // Permissions
    canWritePermissions: true,
    canDeletePermissions: true,
  };
}
