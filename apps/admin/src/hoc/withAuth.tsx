import { type ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@auth/hooks/useAuth';
import { ROUTES } from '@lib/constants';

export function withAuth<P extends object>(Component: ComponentType<P>) {
  function WithAuthWrapper(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

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

    return <Component {...props} />;
  }

  WithAuthWrapper.displayName = `withAuth(${Component.displayName ?? Component.name ?? 'Component'})`;
  return WithAuthWrapper;
}
