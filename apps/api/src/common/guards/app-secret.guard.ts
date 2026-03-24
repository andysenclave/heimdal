import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma';
import type { Request } from 'express';

/**
 * Validates SDK calls by checking the X-App-Secret header against the stored
 * SHA-256 hash for the application identified by the :appId route param.
 *
 * Apply at the controller level on all SDK endpoints:
 *   @UseGuards(AppSecretGuard)
 */
@Injectable()
export class AppSecretGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { resolvedApp?: Record<string, unknown> }>();

    const routeAppId = req.params['appId'] as string | undefined;
    const secretHeader = req.headers['x-app-secret'] as string | undefined;

    if (!routeAppId || !secretHeader) {
      throw new UnauthorizedException('x-app-secret header is required');
    }

    const app = await this.prisma.application.findUnique({
      where: { appId: routeAppId },
    });

    if (!app || !app.isActive) {
      throw new UnauthorizedException('Invalid application credentials');
    }

    const hashedSecret = createHash('sha256').update(secretHeader).digest('hex');
    if (hashedSecret !== app.appSecret) {
      throw new UnauthorizedException('Invalid application credentials');
    }

    // Attach resolved app so downstream handlers don't re-fetch it
    req.resolvedApp = {
      id: app.id,
      appId: app.appId,
      orgId: app.orgId,
      name: app.name,
    };

    return true;
  }
}
