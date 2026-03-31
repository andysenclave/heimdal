import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@auth/AuthProvider';
import { OrgProvider } from '@/context/OrgContext';
import { AppProvider } from '@/context/AppContext';
import { router } from '@/router/routes';
import { useThemeStore } from '@lib/stores/theme-store';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrgProvider>
          <AppProvider>
          <ThemeInitializer />
          <RouterProvider router={router} />
          <Toaster
            position="bottom-right"
            duration={10000}
            gap={8}
            toastOptions={{
              className:
                'font-mono text-[12px] !rounded-md !px-4 !py-3 !shadow-lg !border',
              classNames: {
                success:
                  '!bg-emerald-950/90 !text-emerald-200 !border-emerald-700/50',
                error:
                  '!bg-red-950/90 !text-red-200 !border-red-700/50',
                warning:
                  '!bg-amber-950/90 !text-amber-200 !border-amber-700/50',
                info: '!bg-sky-950/90 !text-sky-200 !border-sky-700/50',
              },
            }}
          />
          </AppProvider>
        </OrgProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
