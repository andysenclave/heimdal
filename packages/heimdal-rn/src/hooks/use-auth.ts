import { useHeimdalContext } from '../context';
import type { AuthUser, HeimdalContextValue } from '../context';

export type { AuthUser };

/**
 * Access Heimdal auth state and actions from any component inside <HeimdalProvider>.
 *
 * ```tsx
 * function LoginScreen() {
 *   const { login, isLoading, error } = useAuth();
 *
 *   const handleSubmit = async () => {
 *     await login(email, password);
 *   };
 * }
 *
 * function ProfileScreen() {
 *   const { user, logout } = useAuth();
 *   if (!user) return <Redirect to="/login" />;
 *   return <Text>Hello, {user.id}</Text>;
 * }
 * ```
 *
 * Throws if called outside <HeimdalProvider>.
 */
export function useAuth(): HeimdalContextValue {
  return useHeimdalContext();
}
