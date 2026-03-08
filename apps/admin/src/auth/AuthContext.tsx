import { createContext } from 'react';
import type { AuthUser } from '@api/types';

export interface AuthContextValue {
  session: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
