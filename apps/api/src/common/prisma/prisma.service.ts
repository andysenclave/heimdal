import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@heimdal/prisma-client';
import { getCurrentTenant } from '../tenant/tenant.context';

/**
 * Tenant-scoped models — these have an `orgId` column and must be
 * filtered automatically to prevent cross-tenant data leakage.
 */
const TENANT_SCOPED_MODELS = new Set([
  'Organization',
  'Application',
  'Role',
  'Permission',
  'AuditLog',
]);

const READ_ACTIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const WRITE_ACTIONS = new Set([
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * HD-017: Returns a tenant-scoped Prisma client that auto-injects
   * orgId WHERE clauses on tenant-scoped models.
   *
   * Platform admins and unauthenticated routes get the unscoped client.
   */
  get tenantScoped(): PrismaService {
    const tenant = getCurrentTenant();

    // No tenant context or platform admin → return unscoped client
    if (!tenant || tenant.isPlatformAdmin) return this;

    return this.$extends({
      query: {
        $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const orgField = model === 'Organization' ? 'id' : 'orgId';

          if (READ_ACTIONS.has(operation) || WRITE_ACTIONS.has(operation)) {
            args.where = { ...args.where, [orgField]: tenant.orgId };
          } else if (operation === 'upsert') {
            args.where = { ...args.where, [orgField]: tenant.orgId };
            args.create = { ...args.create, [orgField]: tenant.orgId };
          }

          return query(args);
        },
      },
    }) as unknown as PrismaService;
  }
}
