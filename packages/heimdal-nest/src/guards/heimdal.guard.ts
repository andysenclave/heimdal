import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { HeimdalJwtClaims } from '@heimdal/shared';
import type { HeimdalModuleOptions } from '../heimdal.module';

/**
 * Core NestJS guard that validates every incoming request against Heimdal.
 *
 * Resolution order:
 *  1. Extract Bearer token from Authorization header
 *  2. POST /guard/check to the Heimdal API with the requested resource + context
 *  3. Cache the decision for the configured TTL (default: 30s)
 *  4. Set `req.user` (HeimdalJwtClaims) on the request so @CurrentUser() can read it
 *
 * Applied via the @HeimdalGuard() convenience decorator — do not use @UseGuards(HeimdalGuardImpl)
 * directly in application code.
 *
 * @todo Week 4 — implement HTTP call to Heimdal /guard/check endpoint and decision cache
 */
@Injectable()
export class HeimdalGuardImpl implements CanActivate {
  constructor(private readonly options: HeimdalModuleOptions) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: HeimdalJwtClaims }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    // TODO: Week 4 — validate token against Heimdal API
    // const token = authHeader.slice(7);
    // const decision = await this.heimdalClient.check({ token, resource, context });
    // if (!decision.allowed) throw new ForbiddenException('Access denied by Heimdal');
    // request.user = decision.user as HeimdalJwtClaims;

    void this.options; // suppress unused warning until implementation
    throw new Error(
      `HeimdalGuard: not yet implemented. Configure your Heimdal API URL via HeimdalModule.register({ baseUrl, appId }). Full implementation arrives in Week 4.`,
    );
  }
}
