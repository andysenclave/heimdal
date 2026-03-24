import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Organization } from '@/types/models';
import { api } from '@api/client';
import { useAuth } from '@auth/hooks/useAuth';

const STORAGE_KEY = 'heimdal_active_org_id';

interface OrgContextValue {
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization) => void;
  clearActiveOrg: () => void;
  isOrgSelected: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!session) {
      setActiveOrgState(null);
      setIsInitialized(true);
      return;
    }

    // Org-admins: auto-bind to their single org, no switching allowed
    if (!session.isHeimdalAdmin && session.org) {
      setActiveOrgState(session.org as Organization);
      setIsInitialized(true);
      return;
    }

    // Platform admins: restore from localStorage
    const storedOrgId = localStorage.getItem(STORAGE_KEY);
    if (!storedOrgId) {
      setIsInitialized(true);
      return;
    }

    let isMounted = true;
    api
      .get(`admin/orgs/${storedOrgId}`)
      .json<Organization>()
      .then((org) => {
        if (isMounted) setActiveOrgState(org);
      })
      .catch(() => {
        if (isMounted) {
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .finally(() => {
        if (isMounted) setIsInitialized(true);
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  const setActiveOrg = useCallback(
    (org: Organization) => {
      // Org-admins cannot switch orgs
      if (session && !session.isHeimdalAdmin) return;
      setActiveOrgState(org);
      localStorage.setItem(STORAGE_KEY, org.id);
    },
    [session],
  );

  const clearActiveOrg = useCallback(() => {
    if (session && !session.isHeimdalAdmin) return;
    setActiveOrgState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  return (
    <OrgContext.Provider
      value={{
        activeOrg,
        setActiveOrg,
        clearActiveOrg,
        isOrgSelected: activeOrg !== null,
      }}
    >
      {isInitialized ? children : null}
    </OrgContext.Provider>
  );
}

export function useActiveOrg(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useActiveOrg must be used within OrgProvider');
  }
  return context;
}
