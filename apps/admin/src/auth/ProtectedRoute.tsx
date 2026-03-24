import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from '@lib/constants';
import type { HeimdalRole } from '@heimdal/shared';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: HeimdalRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-deco-bg">
        <div className="h-8 w-8 rounded-full border-2 border-deco-amber border-t-transparent animate-deco-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (requiredRole && session?.systemRole !== requiredRole) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
