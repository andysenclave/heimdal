/**
 * @andysenclave/heimdal-rn
 *
 * Heimdal IAM SDK for React Native.
 *
 * Quick start:
 *
 * 1. Wrap your app root with the provider:
 *    ```tsx
 *    <HeimdalProvider config={{ baseUrl: '...', appId: '...' }}>
 *      <App />
 *    </HeimdalProvider>
 *    ```
 *
 * 2. Access auth state anywhere inside the tree:
 *    ```tsx
 *    const { user, login, logout, isLoading } = useAuth();
 *    ```
 */

export { HeimdalProvider } from './context';
export type { HeimdalProviderProps, HeimdalConfig, HeimdalContextValue } from './context';

export { useAuth } from './hooks/use-auth';
export type { AuthUser } from './hooks/use-auth';

// Re-export shared types so consumers don't need a separate @heimdal/shared install
export type { HeimdalJwtClaims, GuardCheckResponse } from '@heimdal/shared';
