import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api } from '@api/client';
import type { SessionResponse } from '@api/types';
import { AuthContext } from './AuthContext';

const DEV_MOCK_SESSION: SessionResponse['user'] = {
  id: 'user_dev_mock',
  email: 'admin@thimple.dev',
  name: 'Dev Admin',
  image: null,
  orgId: 'org_dev_mock',
  roles: ['super-admin'],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const data = await api
        .get('auth/session', { retry: 0 })
        .json<SessionResponse>();
      setSession(data.user);
    } catch {
      // In dev mode, fall back to mock session when API is unavailable
      if (import.meta.env.DEV) {
        setSession(DEV_MOCK_SESSION);
      } else {
        setSession(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post('auth/logout');
    } finally {
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
