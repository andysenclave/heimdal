import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AppRef } from '@api/types';
import type { Application } from '@/types/models';
import { api } from '@api/client';
import { useAuth } from '@auth/hooks/useAuth';
import { useActiveOrg } from './OrgContext';

const storageKey = (orgId: string) => `heimdal_active_app_${orgId}`;

interface AppContextValue {
  activeApp: AppRef | null;
  setActiveApp: (app: Application) => void;
  clearActiveApp: () => void;
  /**
   * True when the app is auto-bound from the user's OrgMembership (org members).
   * The selector is read-only when this is true.
   */
  isAppFixed: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { activeOrg } = useActiveOrg();
  const [activeApp, setActiveAppState] = useState<AppRef | null>(null);

  useEffect(() => {
    if (!session) {
      setActiveAppState(null);
      return;
    }

    // Org members: app is auto-bound from their OrgMembership — no switching allowed
    if (session.boundApp) {
      setActiveAppState(session.boundApp);
      return;
    }

    // Platform/org admins: restore persisted selection per-org from localStorage
    if (!activeOrg) {
      setActiveAppState(null);
      return;
    }

    const storedId = localStorage.getItem(storageKey(activeOrg.id));
    if (!storedId) {
      setActiveAppState(null);
      return;
    }

    // Validate the stored app still exists and belongs to this org
    let mounted = true;
    api
      .get(`admin/apps/${storedId}`)
      .json<Application>()
      .then((app) => {
        if (!mounted) return;
        if (app.orgId === activeOrg.id) {
          setActiveAppState({ id: app.id, name: app.name, appId: app.appId });
        } else {
          localStorage.removeItem(storageKey(activeOrg.id));
        }
      })
      .catch(() => {
        if (mounted) localStorage.removeItem(storageKey(activeOrg.id));
      });

    return () => {
      mounted = false;
    };
  }, [session, activeOrg]);

  const setActiveApp = useCallback(
    (app: Application) => {
      if (session?.boundApp) return; // org members cannot switch
      const ref: AppRef = { id: app.id, name: app.name, appId: app.appId };
      setActiveAppState(ref);
      if (activeOrg) localStorage.setItem(storageKey(activeOrg.id), app.id);
    },
    [session, activeOrg],
  );

  const clearActiveApp = useCallback(() => {
    if (session?.boundApp) return;
    setActiveAppState(null);
    if (activeOrg) localStorage.removeItem(storageKey(activeOrg.id));
  }, [session, activeOrg]);

  const isAppFixed = !!session?.boundApp;

  return (
    <AppContext.Provider value={{ activeApp, setActiveApp, clearActiveApp, isAppFixed }}>
      {children}
    </AppContext.Provider>
  );
}

export function useActiveApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useActiveApp must be used within AppProvider');
  }
  return context;
}
