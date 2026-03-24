import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma';
import type { HeimdalJwtClaims } from '@heimdal/shared';

export const ORG_WRITE_KEY = 'org_write_required';

/**
 * Marks an endpoint as requiring org-level write access.
 * Users whose OrgMembership role is 'member' are blocked — they have read-only access.
 * Platform admins and org owners/admins pass through.
 *
 * Apply with: @OrgWriteAccess()
 */
export const OrgWriteAccess = () =>
  (_target: object, _key?: string | symbol, descriptor?: PropertyDescriptor): void => {
    if (descriptor) {
      Reflect.defineMetadata(ORG_WRITE_KEY, true, descriptor.value as object);
    } else {
      Reflect.defineMetadata(ORG_WRITE_KEY, true, _target);
    }
  };

@Injectable()
export class OrgMembershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresWrite = this.reflector.getAllAndOverride<boolean>(ORG_WRITE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresWrite) return true;

    const request = context.switchToHttp().getRequest<{ user?: HeimdalJwtClaims }>();
    const claims = request.user;

    // No claims means JwtAuthGuard already rejected, or it's a @Public() route
    if (!claims?.sub) return true;

    // Platform admins are never restricted
    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      select: { isHeimdalAdmin: true },
    });
    if (user?.isHeimdalAdmin) return true;

    // Org-scoped users: block if their membership role is 'member'
    if (!claims.org) return true;

    const membership = await this.prisma.orgMembership.findFirst({
      where: { userId: claims.sub, orgId: claims.org },
      select: { role: true },
    });

    if (!membership || membership.role === 'member') {
      throw new ForbiddenException(
        'Organization members have read-only access to roles and permissions',
      );
    }

    return true;
  }
}
