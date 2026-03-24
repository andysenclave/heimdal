import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@auth/ProtectedRoute';
import { useSession } from '@auth/hooks/useSession';
import { ROUTES } from '@lib/constants';
import { HEIMDAL_ROLES } from '@heimdal/shared';
import type { ReactNode } from 'react';

const RootLayout = lazy(() => import('@components/layout/RootLayout'));
const Dashboard = lazy(() => import('@pages/Dashboard'));
const Organizations = lazy(() => import('@pages/Organizations'));
const Users = lazy(() => import('@pages/Users'));
const Applications = lazy(() => import('@pages/Applications'));
const Roles = lazy(() => import('@pages/Roles'));
const Permissions = lazy(() => import('@pages/Permissions'));
const Invites = lazy(() => import('@pages/Invites'));
const GuardTester = lazy(() => import('@pages/GuardTester'));
const AuditLog = lazy(() => import('@pages/AuditLog'));
const Profile = lazy(() => import('@pages/Profile'));
const Login = lazy(() => import('@pages/Login'));
const Signup = lazy(() => import('@pages/Signup'));
const NotFound = lazy(() => import('@pages/NotFound'));

/**
 * Redirects org members (role: 'member') to /roles.
 * Platform admins and org owners/admins pass through freely.
 */
function NotForOrgMember({ children }: { children: ReactNode }) {
  const { isOrgMember } = useSession();
  if (isOrgMember) return <Navigate to={ROUTES.ROLES} replace />;
  return <>{children}</>;
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <div className="h-6 w-6 rounded-full border-2 border-deco-amber border-t-transparent animate-deco-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LazyPage>
          <RootLayout />
        </LazyPage>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <NotForOrgMember>
            <LazyPage><Dashboard /></LazyPage>
          </NotForOrgMember>
        ),
      },
      {
        path: 'organizations',
        element: (
          <ProtectedRoute requiredRole={HEIMDAL_ROLES.PLATFORM_ADMIN}>
            <LazyPage><Organizations /></LazyPage>
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <NotForOrgMember>
            <LazyPage><Users /></LazyPage>
          </NotForOrgMember>
        ),
      },
      {
        path: 'applications',
        element: (
          <NotForOrgMember>
            <LazyPage><Applications /></LazyPage>
          </NotForOrgMember>
        ),
      },
      { path: 'roles', element: <LazyPage><Roles /></LazyPage> },
      { path: 'permissions', element: <LazyPage><Permissions /></LazyPage> },
      {
        path: 'invites',
        element: (
          <NotForOrgMember>
            <LazyPage><Invites /></LazyPage>
          </NotForOrgMember>
        ),
      },
      {
        path: 'guard-tester',
        element: (
          <NotForOrgMember>
            <LazyPage><GuardTester /></LazyPage>
          </NotForOrgMember>
        ),
      },
      {
        path: 'audit-log',
        element: (
          <ProtectedRoute requiredRole={HEIMDAL_ROLES.PLATFORM_ADMIN}>
            <LazyPage><AuditLog /></LazyPage>
          </ProtectedRoute>
        ),
      },
      { path: 'profile', element: <LazyPage><Profile /></LazyPage> },
    ],
  },
  {
    path: ROUTES.LOGIN,
    element: <LazyPage><Login /></LazyPage>,
  },
  {
    path: ROUTES.SIGNUP,
    element: <LazyPage><Signup /></LazyPage>,
  },
  {
    path: '*',
    element: <LazyPage><NotFound /></LazyPage>,
  },
];

export const router = createBrowserRouter(routes);
