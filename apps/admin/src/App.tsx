import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@auth/AuthProvider';
import { router } from '@/router/routes';
import { useThemeStore } from '@lib/stores/themeStore';
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
        <ThemeInitializer />
        <RouterProvider router={router} />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'font-mono text-xs',
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
