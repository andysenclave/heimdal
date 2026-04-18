import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GuardService } from '../guard.service';
import { EntitlementService } from '../../entitlement/entitlement.service';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../../common/prisma';

describe('GuardService', () => {
  let service: GuardService;

  const jwtVerify = jest.fn();
  const appFindUnique = jest.fn();
  const bindingFindMany = jest.fn();
  const resolveEntitlements = jest.fn();
  const auditLog = jest.fn().mockResolvedValue(undefined);

  const prisma = {
    application: { findUnique: appFindUnique },
    accessBinding: { findMany: bindingFindMany },
  };

  const validClaims = {
    sub: 'user_123',
    org: 'org_456',
    aud: 'app_mimir',
    roles: ['admin'],
    sessionId: 'sess_abc',
    jti: 'jti_xyz',
    iss: 'heimdal' as const,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardService,
        { provide: JwtService, useValue: { verify: jwtVerify } },
        { provide: PrismaService, useValue: prisma },
        { provide: EntitlementService, useValue: { resolveEntitlements } },
        { provide: AuditService, useValue: { log: auditLog } },
      ],
    }).compile();

    service = module.get(GuardService);
  });

  const baseInput = {
    authorization: 'Bearer valid-token',
    appId: 'app_mimir',
    requestId: 'req_001',
    resource: 'POST /api/trades',
  };

  // ─── JWT Validation ──────────────────────────────────────────────────────

  describe('JWT validation', () => {
    it('should reject missing authorization header', async () => {
      await expect(
        service.check({ ...baseInput, authorization: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject invalid token', async () => {
      jwtVerify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.check(baseInput)).rejects.toThrow(UnauthorizedException);
    });

    it('should strip Bearer prefix', async () => {
      jwtVerify.mockReturnValue(validClaims);
      appFindUnique.mockResolvedValue(null);

      await service.check(baseInput);
      expect(jwtVerify).toHaveBeenCalledWith('valid-token');
    });
  });

  // ─── App Validation ─────────────────────────────────────────────────────

  describe('App validation', () => {
    it('should deny when app is not found', async () => {
      jwtVerify.mockReturnValue(validClaims);
      appFindUnique.mockResolvedValue(null);

      const result = await service.check(baseInput);
      expect(result.allowed).toBe(false);
    });

    it('should deny when app is inactive', async () => {
      jwtVerify.mockReturnValue(validClaims);
      appFindUnique.mockResolvedValue({ id: 'a1', isActive: false, orgId: 'org1' });

      const result = await service.check(baseInput);
      expect(result.allowed).toBe(false);
    });
  });

  // ─── Permission Resolution ──────────────────────────────────────────────

  describe('Permission resolution', () => {
    beforeEach(() => {
      jwtVerify.mockReturnValue(validClaims);
      appFindUnique.mockResolvedValue({ id: 'a1', isActive: true, orgId: 'org1' });
    });

    it('should allow when resource has no bindings (open resource)', async () => {
      resolveEntitlements.mockResolvedValue({
        roles: [{ id: 'r1', name: 'admin', isSystem: true }],
        permissions: [{ id: 'p1', key: 'trade:execute', description: null }],
        resolvedRoleChain: ['r1'],
      });
      bindingFindMany.mockResolvedValue([]);

      const result = await service.check(baseInput);
      expect(result.allowed).toBe(true);
      expect(result.requiredPermissions).toEqual([]);
    });

    it('should allow when user has all required permissions', async () => {
      resolveEntitlements.mockResolvedValue({
        roles: [{ id: 'r1', name: 'admin', isSystem: true }],
        permissions: [
          { id: 'p1', key: 'trade:execute', description: null },
          { id: 'p2', key: 'trade:read', description: null },
        ],
        resolvedRoleChain: ['r1'],
      });
      bindingFindMany.mockResolvedValue([
        { permission: { key: 'trade:execute' } },
      ]);

      const result = await service.check(baseInput);
      expect(result.allowed).toBe(true);
      expect(result.matchedPermissions).toContain('trade:execute');
    });

    it('should deny when user is missing required permissions', async () => {
      resolveEntitlements.mockResolvedValue({
        roles: [{ id: 'r1', name: 'viewer', isSystem: false }],
        permissions: [{ id: 'p1', key: 'trade:read', description: null }],
        resolvedRoleChain: ['r1'],
      });
      bindingFindMany.mockResolvedValue([
        { permission: { key: 'trade:execute' } },
      ]);

      const result = await service.check(baseInput);
      expect(result.allowed).toBe(false);
      expect(result.requiredPermissions).toContain('trade:execute');
      expect(result.matchedPermissions).toEqual([]);
    });

    it('should deny when user has some but not all required permissions', async () => {
      resolveEntitlements.mockResolvedValue({
        roles: [{ id: 'r1', name: 'editor', isSystem: false }],
        permissions: [{ id: 'p1', key: 'trade:read', description: null }],
        resolvedRoleChain: ['r1'],
      });
      bindingFindMany.mockResolvedValue([
        { permission: { key: 'trade:read' } },
        { permission: { key: 'trade:execute' } },
      ]);

      const result = await service.check(baseInput);
      expect(result.allowed).toBe(false);
    });
  });

  // ─── Audit Logging ──────────────────────────────────────────────────────

  describe('Audit logging', () => {
    it('should log every decision to audit service', async () => {
      jwtVerify.mockReturnValue(validClaims);
      appFindUnique.mockResolvedValue({ id: 'a1', isActive: true, orgId: 'org1' });
      resolveEntitlements.mockResolvedValue({
        roles: [],
        permissions: [],
        resolvedRoleChain: [],
      });
      bindingFindMany.mockResolvedValue([]);

      await service.check(baseInput);

      // Allow async audit to fire
      await new Promise((r) => setTimeout(r, 10));

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'guard.check',
          actorId: 'user_123',
          resourceType: 'guard-decision',
          metadata: expect.objectContaining({
            resource: 'POST /api/trades',
            appId: 'app_mimir',
          }),
        }),
      );
    });
  });

  // ─── Response Shape ─────────────────────────────────────────────────────

  describe('Response shape', () => {
    it('should return evaluationMs and resolvedAt', async () => {
      jwtVerify.mockReturnValue(validClaims);
      appFindUnique.mockResolvedValue({ id: 'a1', isActive: true, orgId: 'org1' });
      resolveEntitlements.mockResolvedValue({
        roles: [{ id: 'r1', name: 'admin', isSystem: true }],
        permissions: [],
        resolvedRoleChain: ['r1'],
      });
      bindingFindMany.mockResolvedValue([]);

      const result = await service.check(baseInput);
      expect(result.evaluationMs).toBeGreaterThanOrEqual(0);
      expect(result.resolvedAt).toBeDefined();
      expect(result.user.id).toBe('user_123');
      expect(result.user.orgId).toBe('org_456');
      expect(result.decisionId).toBe('req_001');
    });
  });
});
