import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api } from '@api/client';
import { tokenStore } from '@api/tokenStore';
import type { AuthUser, SessionResponse } from '@api/types';
// AuthUser imported for type narrowing of orgMembershipRole
type OrgMembershipRole = AuthUser['orgMembershipRole'];
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    if (!tokenStore.hasTokens()) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.get('auth/session', { retry: 0 }).json<SessionResponse>();
      // Flatten API response into the AuthUser shape the UI needs
      // roles[0] is always the OrgMembership role (owner | admin | member)
      const firstRole = data.session.roles[0];
      const orgMembershipRole: OrgMembershipRole =
        firstRole === 'owner' || firstRole === 'admin' ? firstRole : 'member';

      setSession({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        orgId: data.session.orgId,
        roles: data.session.roles,
        systemRole: data.systemRole,
        isHeimdalAdmin: data.user.isHeimdalAdmin,
        orgMembershipRole,
        org: data.org,
        boundApp: data.boundApp ?? null,
      });
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('auth/logout', { json: { refreshToken } });
      }
    } finally {
      tokenStore.clear();
      setSession(null);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: session !== null,
        signOut,
        refetchSession: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
