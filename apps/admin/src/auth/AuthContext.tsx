import { createContext } from 'react';
import type { SessionResponse } from '@api/types';

export interface AuthContextValue {
  session: SessionResponse['user'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
