import React, { createContext, useContext, useState } from 'react';
import type { HeimdalJwtClaims } from '@heimdal/shared';

// ─── Config ─────────────────────────────────────────────────────────────────

export interface HeimdalConfig {
  /** Base URL of the Heimdal API. Example: https://heimdal.thimple.io */
  baseUrl: string;
  /** The App ID registered in Heimdal for this mobile app. */
  appId: string;
}

// ─── Auth state shape ────────────────────────────────────────────────────────

export interface AuthUser {
  /** Maps to HeimdalJwtClaims.sub */
  id: string;
  /** Maps to HeimdalJwtClaims.org */
  orgId: string;
  /** Maps to HeimdalJwtClaims.aud */
  appId: string;
  /** Maps to HeimdalJwtClaims.roles */
  roles: string[];
  /** Maps to HeimdalJwtClaims.sessionId */
  sessionId: string;
}

export interface HeimdalContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const HeimdalContext = createContext<HeimdalContextValue | null>(null);

export function useHeimdalContext(): HeimdalContextValue {
  const ctx = useContext(HeimdalContext);
  if (!ctx) {
    throw new Error('useHeimdalContext must be used inside <HeimdalProvider>');
  }
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface HeimdalProviderProps {
  config: HeimdalConfig;
  children: React.ReactNode;
}

/**
 * Wraps your app with Heimdal auth context.
 *
 * Place at the root of your React Native app:
 * ```tsx
 * // App.tsx
 * export default function App() {
 *   return (
 *     <HeimdalProvider config={{ baseUrl: '...', appId: '...' }}>
 *       <RootNavigator />
 *     </HeimdalProvider>
 *   );
 * }
 * ```
 *
 * @todo Week 4 — implement token storage (SecureStore), refresh flow, and
 *               session restoration on app launch.
 */
export function HeimdalProvider({ config, children }: HeimdalProviderProps): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // TODO: Week 4 — restore session from SecureStore on mount
  // TODO: Week 4 — set up token refresh interval

  const login = async (_email: string, _password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Week 4 — POST config.baseUrl/api/v1/auth/login
      // const { accessToken } = await heimdalFetch(config, '/auth/login', { email, password });
      // const claims = decodeJwt<HeimdalJwtClaims>(accessToken);
      // await SecureStore.setItemAsync('heimdal_token', accessToken);
      // setUser(claimsToAuthUser(claims));
      throw new Error('HeimdalProvider.login: not yet implemented — coming in Week 4');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    // TODO: Week 4 — POST /auth/logout + clear SecureStore
    setUser(null);
  };

  const refreshSession = async (): Promise<void> => {
    // TODO: Week 4 — use refresh token to get new access token
    throw new Error('HeimdalProvider.refreshSession: not yet implemented — coming in Week 4');
  };

  const value: HeimdalContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
    refreshSession,
  };

  // Suppress unused config warning until implementation
  void config;

  return React.createElement(HeimdalContext.Provider, { value }, children);
}

// ─── Internal helpers (Week 4) ───────────────────────────────────────────────

/** @internal */
export function _claimsToAuthUser(claims: HeimdalJwtClaims): AuthUser {
  return {
    id: claims.sub,
    orgId: claims.org,
    appId: claims.aud,
    roles: claims.roles,
    sessionId: claims.sessionId,
  };
}
