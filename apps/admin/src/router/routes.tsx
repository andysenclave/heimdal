import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@auth/ProtectedRoute';
import { ROUTES } from '@lib/constants';

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
      { index: true, element: <LazyPage><Dashboard /></LazyPage> },
      { path: 'organizations', element: <LazyPage><Organizations /></LazyPage> },
      { path: 'users', element: <LazyPage><Users /></LazyPage> },
      { path: 'applications', element: <LazyPage><Applications /></LazyPage> },
      { path: 'roles', element: <LazyPage><Roles /></LazyPage> },
      { path: 'permissions', element: <LazyPage><Permissions /></LazyPage> },
      { path: 'invites', element: <LazyPage><Invites /></LazyPage> },
      { path: 'guard-tester', element: <LazyPage><GuardTester /></LazyPage> },
      { path: 'audit-log', element: <LazyPage><AuditLog /></LazyPage> },
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
