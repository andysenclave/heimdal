import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ORG_SCOPED_KEY } from '../decorators/org-scoped.decorator';
import type { HeimdalJwtClaims } from '@heimdal/shared';
import { PrismaService } from '../prisma';

@Injectable()
export class OrgScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOrgScoped = this.reflector.getAllAndOverride<boolean>(ORG_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isOrgScoped) return true;

    const request = context.switchToHttp().getRequest<{
      user?: HeimdalJwtClaims;
      params: Record<string, string>;
      query: Record<string, string>;
      body: Record<string, unknown>;
      resolvedOrgId?: string;
    }>();

    const claims = request.user;
    if (!claims?.sub) return true; // JwtAuthGuard already handles missing auth

    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      select: { isHeimdalAdmin: true },
    });

    if (user?.isHeimdalAdmin) {
      // Platform admins can operate on any org — no restriction
      return true;
    }

    // Org-admins: validate that the requested orgId matches their bound org
    const requestedOrgId =
      request.params['orgId'] ??
      request.query['orgId'] ??
      (request.body?.['orgId'] as string | undefined);

    if (requestedOrgId && requestedOrgId !== claims.org) {
      throw new ForbiddenException('You can only access resources in your own organization');
    }

    // Inject resolved orgId so controllers don't need to re-derive it
    request.resolvedOrgId = claims.org;
    return true;
  }
}
