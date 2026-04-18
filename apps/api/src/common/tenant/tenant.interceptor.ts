import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from './tenant.context';
import type { HeimdalJwtClaims } from '@heimdal/shared';

/**
 * Sets the tenant context for the duration of the request.
 *
 * Reads orgId from JWT claims (request.user) and wraps the handler
 * inside AsyncLocalStorage.run() so all downstream code — including
 * Prisma queries — can access the current tenant via getCurrentTenant().
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: HeimdalJwtClaims & { isHeimdalAdmin?: boolean };
      resolvedOrgId?: string;
    }>();

    const claims = request.user;
    if (!claims?.sub) {
      // Public route or no auth — no tenant context
      return next.handle();
    }

    const orgId = request.resolvedOrgId ?? claims.org;
    const isPlatformAdmin = !!claims.isHeimdalAdmin;

    return new Observable((subscriber) => {
      tenantStorage.run({ orgId, isPlatformAdmin }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
