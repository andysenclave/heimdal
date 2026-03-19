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

const STORAGE_KEY = 'heimdal_active_org_id';

interface OrgContextValue {
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization) => void;
  clearActiveOrg: () => void;
  isOrgSelected: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
  const [storedOrgId, setStoredOrgId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  // When storedOrgId changes, try to load that org
  useEffect(() => {
    if (!storedOrgId) return;

    let isMounted = true;

    api
      .get(`admin/orgs/${storedOrgId}`)
      .json<Organization>()
      .then((org) => {
        if (isMounted) {
          setActiveOrgState(org);
        }
      })
      .catch(() => {
        // Org no longer accessible — clear stored ID
        if (isMounted) {
          localStorage.removeItem(STORAGE_KEY);
          setStoredOrgId(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [storedOrgId]);

  const setActiveOrg = useCallback((org: Organization) => {
    setActiveOrgState(org);
    localStorage.setItem(STORAGE_KEY, org.id);
  }, []);

  const clearActiveOrg = useCallback(() => {
    setActiveOrgState(null);
    localStorage.removeItem(STORAGE_KEY);
    setStoredOrgId(null);
  }, []);

  return (
    <OrgContext.Provider
      value={{
        activeOrg,
        setActiveOrg,
        clearActiveOrg,
        isOrgSelected: activeOrg !== null,
      }}
    >
      {children}
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
