import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  orgId: string;
  isPlatformAdmin: boolean;
}

/**
 * Request-scoped tenant context using AsyncLocalStorage.
 *
 * Set by TenantInterceptor at the start of each request.
 * Read by Prisma tenant extension to auto-inject orgId WHERE clauses.
 *
 * Platform admins (isPlatformAdmin = true) bypass tenant filtering —
 * they can query across all orgs.
 */
export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getCurrentTenant(): TenantStore | undefined {
  return tenantStorage.getStore();
}
