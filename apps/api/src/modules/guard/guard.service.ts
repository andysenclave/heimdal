import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma';
import { EntitlementService } from '../entitlement/entitlement.service';
import { AuditService } from '../audit/audit.service';
import type { HeimdalJwtClaims } from '@heimdal/shared';

export interface GuardCheckInput {
  authorization: string;
  appId: string;
  requestId: string;
  resource: string;
  context?: Record<string, string>;
}

export interface GuardCheckResult {
  allowed: boolean;
  user: { id: string; orgId: string; roles: string[] };
  matchedPermissions: string[];
  requiredPermissions: string[];
  decisionId: string;
  evaluationMs: number;
  resolvedAt: string;
}

@Injectable()
export class GuardService {
  private readonly logger = new Logger(GuardService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly entitlementService: EntitlementService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * POST /api/v1/guard/check
   *
   * Full guard decision flow:
   *   1. Validate JWT token
   *   2. Verify app is registered
   *   3. Resolve entitlements (roles + permissions via hierarchy)
   *   4. Match required permissions against resource bindings
   *   5. Log decision to audit trail
   */
  async check(input: GuardCheckInput): Promise<GuardCheckResult> {
    const start = Date.now();

    // 1. Validate JWT
    const claims = this.verifyToken(input.authorization);

    // 2. Verify app is registered and active
    const app = await this.prisma.application.findUnique({
      where: { appId: input.appId },
      select: { id: true, isActive: true, orgId: true },
    });

    if (!app || !app.isActive) {
      const result = this.buildDenied(claims, [], [], start, 'App not found or inactive');
      this.logDecision(result, input, app?.orgId).catch(() => {});
      return result;
    }

    // 3. Resolve entitlements — walk role hierarchy, aggregate permissions
    const entitlements = await this.entitlementService.resolveEntitlements(
      app.id,
      claims.sub,
    );

    const userPermKeys = new Set(entitlements.permissions.map((p) => p.key));
    const userRoleNames = entitlements.roles.map((r) => r.name);

    // 4. Find required permissions for this resource via access bindings
    const bindings = await this.prisma.accessBinding.findMany({
      where: { appId: app.id, resource: input.resource },
      include: { permission: { select: { key: true } } },
    });

    const requiredPermissions = bindings.map((b) => b.permission.key);
    const matchedPermissions: string[] = [];

    // If no bindings exist for this resource, allow (open resource)
    let allowed: boolean;
    if (requiredPermissions.length === 0) {
      allowed = true;
    } else {
      // Check if user has ALL required permissions
      allowed = requiredPermissions.every((perm) => {
        if (userPermKeys.has(perm)) {
          matchedPermissions.push(perm);
          return true;
        }
        return false;
      });
    }

    const result: GuardCheckResult = {
      allowed,
      user: { id: claims.sub, orgId: claims.org, roles: userRoleNames },
      matchedPermissions,
      requiredPermissions,
      decisionId: input.requestId || `gd_${Date.now()}`,
      evaluationMs: Date.now() - start,
      resolvedAt: new Date().toISOString(),
    };

    // 5. Async audit log (fire-and-forget)
    this.logger.log(
      `Guard check: ${result.allowed ? 'ALLOW' : 'DENY'} user=${claims.sub} resource=${input.resource} (${result.evaluationMs}ms)`,
    );
    this.logDecision(result, input, app.orgId).catch(() => {});

    return result;
  }

  private verifyToken(authorization: string): HeimdalJwtClaims {
    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : authorization;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      return this.jwt.verify<HeimdalJwtClaims>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private buildDenied(
    claims: HeimdalJwtClaims,
    matchedPermissions: string[],
    requiredPermissions: string[],
    startMs: number,
    _reason: string,
  ): GuardCheckResult {
    return {
      allowed: false,
      user: { id: claims.sub, orgId: claims.org, roles: [] },
      matchedPermissions,
      requiredPermissions,
      decisionId: `gd_${Date.now()}`,
      evaluationMs: Date.now() - startMs,
      resolvedAt: new Date().toISOString(),
    };
  }

  private async logDecision(
    result: GuardCheckResult,
    input: GuardCheckInput,
    orgId?: string,
  ): Promise<void> {
    await this.auditService.log({
      action: 'guard.check',
      actorId: result.user.id || undefined,
      orgId: orgId ?? result.user.orgId,
      resourceType: 'guard-decision',
      resourceId: result.decisionId,
      metadata: {
        allowed: result.allowed,
        resource: input.resource,
        appId: input.appId,
        matchedPermissions: result.matchedPermissions,
        requiredPermissions: result.requiredPermissions,
        evaluationMs: result.evaluationMs,
      },
    });
  }
}
