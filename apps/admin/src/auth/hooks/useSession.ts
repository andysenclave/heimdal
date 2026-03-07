import { useAuth } from './useAuth';

export function useSession() {
  const { session } = useAuth();

  return {
    user: session,
    userId: session?.id ?? null,
    orgId: session?.orgId ?? null,
    roles: session?.roles ?? [],
    hasRole: (role: string) => session?.roles.includes(role) ?? false,
  };
}
