import { HEIMDAL_ROLES } from '@heimdal/shared';
import { useAuth } from './useAuth';

export function useSession() {
  const { session } = useAuth();

  const orgMembershipRole = session?.orgMembershipRole ?? 'member';
  const isHeimdalAdmin = session?.isHeimdalAdmin ?? false;
  // Org members are non-admin users whose OrgMembership role is 'member'
  const isOrgMember = !isHeimdalAdmin && orgMembershipRole === 'member';

  return {
    user: session,
    userId: session?.id ?? null,
    orgId: session?.orgId ?? null,
    roles: session?.roles ?? [],
    systemRole: session?.systemRole ?? null,
    orgMembershipRole,
    isHeimdalAdmin,
    isOrgMember,
    isOrgAdmin: session?.systemRole === HEIMDAL_ROLES.ORG_ADMIN && !isOrgMember,
    isPlatformAdmin: session?.systemRole === HEIMDAL_ROLES.PLATFORM_ADMIN,
    hasRole: (role: string) => session?.roles.includes(role) ?? false,
    boundOrg: session?.org ?? null,
  };
}
