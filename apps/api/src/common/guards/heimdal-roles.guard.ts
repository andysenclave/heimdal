import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { HEIMDAL_ROLES } from '@heimdal/shared';
import type { HeimdalRole, HeimdalJwtClaims } from '@heimdal/shared';
import { PrismaService } from '../prisma';

@Injectable()
export class HeimdalRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<HeimdalRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — allow (only JWT auth required)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: HeimdalJwtClaims }>();
    const claims = request.user;

    if (!claims?.sub) {
      throw new ForbiddenException('No authentication claims found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      select: { isHeimdalAdmin: true },
    });

    const userSystemRole: HeimdalRole = user?.isHeimdalAdmin
      ? HEIMDAL_ROLES.PLATFORM_ADMIN
      : HEIMDAL_ROLES.ORG_ADMIN;

    if (!requiredRoles.includes(userSystemRole)) {
      throw new ForbiddenException(
        `This action requires one of: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
