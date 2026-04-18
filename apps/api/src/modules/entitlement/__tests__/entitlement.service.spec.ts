import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EntitlementService } from '../entitlement.service';
import { PrismaService } from '../../../common/prisma';

describe('EntitlementService', () => {
  let service: EntitlementService;

  // ─── Prisma mocks ────────────────────────────────────────────────────────

  const roleFindUnique = jest.fn();
  const roleFindMany = jest.fn();
  const roleCreate = jest.fn();
  const roleUpdate = jest.fn();
  const roleDelete = jest.fn();
  const roleUpdateMany = jest.fn();

  const permFindUnique = jest.fn();
  const permFindMany = jest.fn();
  const permCreate = jest.fn();
  const permUpdate = jest.fn();
  const permDelete = jest.fn();

  const rpCreateMany = jest.fn();
  const rpFindUnique = jest.fn();
  const rpFindMany = jest.fn();
  const rpDelete = jest.fn();

  const uarFindUnique = jest.fn();
  const uarFindMany = jest.fn();
  const uarUpsert = jest.fn();
  const uarDelete = jest.fn();

  const abFindUnique = jest.fn();
  const abFindMany = jest.fn();
  const abCreate = jest.fn();
  const abUpdate = jest.fn();
  const abDelete = jest.fn();

  const appFindUnique = jest.fn();
  const userFindUnique = jest.fn();
  const amFindMany = jest.fn();

  const prisma = {
    role: { findUnique: roleFindUnique, findMany: roleFindMany, create: roleCreate, update: roleUpdate, delete: roleDelete, updateMany: roleUpdateMany },
    permission: { findUnique: permFindUnique, findMany: permFindMany, create: permCreate, update: permUpdate, delete: permDelete },
    rolePermission: { createMany: rpCreateMany, findUnique: rpFindUnique, findMany: rpFindMany, delete: rpDelete },
    userAppRole: { findUnique: uarFindUnique, findMany: uarFindMany, upsert: uarUpsert, delete: uarDelete },
    accessBinding: { findUnique: abFindUnique, findMany: abFindMany, create: abCreate, update: abUpdate, delete: abDelete },
    application: { findUnique: appFindUnique },
    user: { findUnique: userFindUnique },
    appMembership: { findMany: amFindMany },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(EntitlementService);
  });

  // ─── Role CRUD ───────────────────────────────────────────────────────────

  describe('createRole', () => {
    it('should create a role', async () => {
      appFindUnique.mockResolvedValue({ id: 'app1' });
      roleFindUnique.mockResolvedValue(null);
      roleCreate.mockResolvedValue({ id: 'role1', name: 'editor' });

      const result = await service.createRole('app1', { name: 'editor', orgId: 'org1' } as never);
      expect(result).toEqual({ id: 'role1', name: 'editor' });
      expect(roleCreate).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate role name', async () => {
      appFindUnique.mockResolvedValue({ id: 'app1' });
      roleFindUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createRole('app1', { name: 'editor', orgId: 'org1' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when app does not exist', async () => {
      appFindUnique.mockResolvedValue(null);

      await expect(
        service.createRole('missing', { name: 'editor', orgId: 'org1' } as never),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteRole', () => {
    it('should throw ForbiddenException for system roles', async () => {
      roleFindUnique.mockResolvedValue({ id: 'r1', isSystem: true, derivedRoles: [] });

      await expect(service.deleteRole('r1')).rejects.toThrow(ForbiddenException);
    });

    it('should re-base derived roles before deleting', async () => {
      roleFindUnique.mockResolvedValue({
        id: 'r1',
        isSystem: false,
        baseRoleId: 'r0',
        derivedRoles: [{ id: 'r2' }],
      });
      roleUpdateMany.mockResolvedValue({ count: 1 });
      roleDelete.mockResolvedValue({ id: 'r1' });

      await service.deleteRole('r1');
      expect(roleUpdateMany).toHaveBeenCalledWith({
        where: { baseRoleId: 'r1' },
        data: { baseRoleId: 'r0' },
      });
    });
  });

  // ─── Permission CRUD ─────────────────────────────────────────────────────

  describe('createPermission', () => {
    it('should throw ConflictException on duplicate key', async () => {
      appFindUnique.mockResolvedValue({ id: 'app1' });
      permFindUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createPermission('app1', { key: 'trade:execute', orgId: 'org1' } as never),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── Role-Permission assignment ──────────────────────────────────────────

  describe('assignPermissions', () => {
    it('should bulk assign permissions and return role with permissions', async () => {
      roleFindUnique
        .mockResolvedValueOnce({ id: 'r1' }) // getRole
        .mockResolvedValueOnce({ id: 'r1', rolePermissions: [{ permission: { id: 'p1' } }] }); // final findUnique
      rpCreateMany.mockResolvedValue({ count: 1 });

      const result = await service.assignPermissions('r1', { permissionIds: ['p1'] });
      expect(rpCreateMany).toHaveBeenCalledWith({
        data: [{ roleId: 'r1', permissionId: 'p1' }],
        skipDuplicates: true,
      });
      expect(result).toBeDefined();
    });
  });

  describe('removePermissionFromRole', () => {
    it('should throw NotFoundException if not assigned', async () => {
      roleFindUnique.mockResolvedValue({ id: 'r1' });
      rpFindUnique.mockResolvedValue(null);

      await expect(
        service.removePermissionFromRole('r1', 'p1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── User-App-Role assignment ────────────────────────────────────────────

  describe('assignUserRole', () => {
    it('should validate app, user, and role exist', async () => {
      appFindUnique.mockResolvedValue(null);
      userFindUnique.mockResolvedValue({ id: 'u1' });
      roleFindUnique.mockResolvedValue({ id: 'r1', appId: 'app1' });

      await expect(
        service.assignUserRole('app1', 'u1', 'r1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if role belongs to different app', async () => {
      appFindUnique.mockResolvedValue({ id: 'app1' });
      userFindUnique.mockResolvedValue({ id: 'u1' });
      roleFindUnique.mockResolvedValue({ id: 'r1', appId: 'other-app' });

      await expect(
        service.assignUserRole('app1', 'u1', 'r1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeUserRole', () => {
    it('should throw NotFoundException if assignment does not exist', async () => {
      uarFindUnique.mockResolvedValue(null);

      await expect(
        service.removeUserRole('app1', 'u1', 'r1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete the assignment', async () => {
      uarFindUnique.mockResolvedValue({ id: 'uar1' });
      uarDelete.mockResolvedValue({ id: 'uar1' });

      await service.removeUserRole('app1', 'u1', 'r1');
      expect(uarDelete).toHaveBeenCalledWith({ where: { id: 'uar1' } });
    });
  });

  // ─── Access Binding CRUD ─────────────────────────────────────────────────

  describe('deleteBinding', () => {
    it('should throw NotFoundException if binding does not exist', async () => {
      abFindUnique.mockResolvedValue(null);

      await expect(service.deleteBinding('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBinding', () => {
    it('should update and return the binding', async () => {
      abFindUnique.mockResolvedValue({ id: 'ab1' });
      abUpdate.mockResolvedValue({ id: 'ab1', resource: '/new' });

      const result = await service.updateBinding('ab1', { resource: '/new' });
      expect(result.resource).toBe('/new');
    });
  });

  // ─── Entitlement Resolution ──────────────────────────────────────────────

  describe('resolveEntitlements', () => {
    it('should return empty when user has no roles', async () => {
      uarFindMany.mockResolvedValue([]);

      const result = await service.resolveEntitlements('app1', 'u1');
      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should walk role hierarchy and aggregate permissions', async () => {
      // User has "editor" role which inherits from "viewer"
      uarFindMany.mockResolvedValue([
        { roleId: 'editor', role: { id: 'editor', name: 'editor', isSystem: false } },
      ]);

      // editor -> viewer (baseRoleId chain)
      roleFindUnique
        .mockResolvedValueOnce({ baseRoleId: 'viewer' })  // editor's parent
        .mockResolvedValueOnce({ baseRoleId: null });       // viewer has no parent

      // Permissions from both roles
      rpFindMany.mockResolvedValue([
        { permission: { id: 'p1', key: 'portfolio:read', description: null } },
        { permission: { id: 'p2', key: 'portfolio:write', description: null } },
        { permission: { id: 'p1', key: 'portfolio:read', description: null } }, // duplicate
      ]);

      const result = await service.resolveEntitlements('app1', 'u1');
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('editor');
      expect(result.permissions).toHaveLength(2); // deduplicated
      expect(result.resolvedRoleChain).toEqual(['editor', 'viewer']);
    });

    it('should handle circular role references without infinite loop', async () => {
      uarFindMany.mockResolvedValue([
        { roleId: 'a', role: { id: 'a', name: 'role-a', isSystem: false } },
      ]);

      // a -> b -> a (circular)
      roleFindUnique
        .mockResolvedValueOnce({ baseRoleId: 'b' }) // a's parent = b
        .mockResolvedValueOnce({ baseRoleId: 'a' }); // b's parent = a (circular!)

      rpFindMany.mockResolvedValue([]);

      const result = await service.resolveEntitlements('app1', 'u1');
      // Should not throw, should complete with both roles visited
      expect(result.resolvedRoleChain).toEqual(['a', 'b']);
    });
  });
});
