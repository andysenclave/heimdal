import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrgService } from '../org.service';
import { PrismaService } from '../../../common/prisma';
import { AuditService } from '../../audit';

// ---------------------------------------------------------------------------
// Prisma mock helpers — typed explicitly to avoid jest.Mocked<PrismaService>
// fluent-type resolution issues with Prisma 6 delegates.
// ---------------------------------------------------------------------------

type OrgMock = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  _count: { applications: number; memberships: number };
};

const makeOrgMock = (overrides: Partial<OrgMock> = {}): OrgMock => ({
  id: 'org_1',
  name: 'Acme Corp',
  slug: 'acme-corp',
  plan: 'pro',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  _count: { applications: 5, memberships: 3 },
  ...overrides,
});

describe('OrgService', () => {
  let service: OrgService;

  // Mocks for prisma.organization.*
  const orgFindUnique = jest.fn();
  const orgFindMany = jest.fn();
  const orgFindFirst = jest.fn();
  const orgCreate = jest.fn();
  const orgUpdate = jest.fn();

  // Transaction mock — shared tx object used inside the $transaction callback
  const txOrgUpdate = jest.fn();
  const txOrgMembershipFindMany = jest.fn();
  const txOrgMembershipGroupBy = jest.fn();
  const txSessionDeleteMany = jest.fn();

  const txMock = {
    organization: { update: txOrgUpdate },
    orgMembership: {
      findMany: txOrgMembershipFindMany,
      groupBy: txOrgMembershipGroupBy,
    },
    session: { deleteMany: txSessionDeleteMany },
  };

  const prismaTransaction = jest.fn().mockImplementation(
    (fnOrArray: ((tx: typeof txMock) => Promise<unknown>) | unknown[]) => {
      if (typeof fnOrArray === 'function') {
        return fnOrArray(txMock);
      }
      return Promise.resolve(fnOrArray.map(() => undefined));
    },
  );

  // Mocks for orgMembership (direct calls, e.g. in transferOwnership)
  const omFindFirst = jest.fn();
  const omUpdate = jest.fn();

  // AuditService mock — log should resolve silently
  const auditLog = jest.fn().mockResolvedValue(undefined);

  const mockOrg = makeOrgMock();

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: transaction calls callback with txMock
    prismaTransaction.mockImplementation(
      (fnOrArray: ((tx: typeof txMock) => Promise<unknown>) | unknown[]) => {
        if (typeof fnOrArray === 'function') {
          return fnOrArray(txMock);
        }
        return Promise.resolve(fnOrArray.map(() => undefined));
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgService,
        {
          provide: PrismaService,
          useValue: {
            organization: {
              findUnique: orgFindUnique,
              findMany: orgFindMany,
              findFirst: orgFindFirst,
              create: orgCreate,
              update: orgUpdate,
            },
            orgMembership: {
              findFirst: omFindFirst,
              update: omUpdate,
            },
            $transaction: prismaTransaction,
          },
        },
        {
          provide: AuditService,
          useValue: { log: auditLog },
        },
      ],
    }).compile();

    service = module.get<OrgService>(OrgService);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create an organization with auto-slugified name', async () => {
      const dto = { name: 'Acme Corp' };
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(mockOrg);

      const result = await service.create(dto);

      expect(result.slug).toBe('acme-corp');
      expect(orgFindUnique).toHaveBeenCalledWith({ where: { slug: 'acme-corp' } });
      expect(orgCreate).toHaveBeenCalledWith({
        data: { name: 'Acme Corp', slug: 'acme-corp', plan: 'free' },
        include: { _count: { select: { applications: true, memberships: true } } },
      });
    });

    it('should create an organization with custom slug', async () => {
      const dto = { name: 'Acme Corp', slug: 'custom-slug' };
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(makeOrgMock({ slug: 'custom-slug' }));

      const result = await service.create(dto);

      expect(result.slug).toBe('custom-slug');
      expect(orgFindUnique).toHaveBeenCalledWith({ where: { slug: 'custom-slug' } });
    });

    it('should create an organization with specified plan', async () => {
      const dto = { name: 'Acme Corp', plan: 'pro' };
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(mockOrg);

      await service.create(dto);

      expect(orgCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ plan: 'pro' }),
        }),
      );
    });

    it('should default plan to "free" if not provided', async () => {
      const dto = { name: 'Acme Corp' };
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(makeOrgMock({ plan: 'free' }));

      await service.create(dto);

      expect(orgCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ plan: 'free' }),
        }),
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      const dto = { name: 'Acme Corp' };
      orgFindUnique.mockResolvedValue(mockOrg);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        'Organization with slug "acme-corp" already exists',
      );
    });

    it('should throw ConflictException if custom slug already exists', async () => {
      const dto = { name: 'Acme Corp', slug: 'existing-slug' };
      orgFindUnique.mockResolvedValue(mockOrg);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should include entity counts in response', async () => {
      const dto = { name: 'Acme Corp' };
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(mockOrg);

      const result = await service.create(dto);

      expect(result._count).toEqual({ applications: 5, memberships: 3 });
    });

    it('should fire audit log on successful create', async () => {
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(mockOrg);

      await service.create({ name: 'Acme Corp' });

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'org.create' }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------

  describe('findAll', () => {
    it('should return all non-deleted organizations ordered by createdAt desc', async () => {
      const orgs = [mockOrg, makeOrgMock({ id: 'org_2', name: 'Beta Inc' })];
      orgFindMany.mockResolvedValue(orgs);

      const result = await service.findAll();

      expect(result).toEqual(orgs);
      expect(orgFindMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: { _count: { select: { applications: true, memberships: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should exclude soft-deleted organizations', async () => {
      orgFindMany.mockResolvedValue([mockOrg]);

      await service.findAll();

      expect(orgFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
    });

    it('should return empty array when no organizations exist', async () => {
      orgFindMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should include entity counts in each organization', async () => {
      orgFindMany.mockResolvedValue([mockOrg]);

      const result = await service.findAll();

      expect(result[0]._count).toEqual({ applications: 5, memberships: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------

  describe('findOne', () => {
    it('should return an organization by id', async () => {
      orgFindFirst.mockResolvedValue(mockOrg);

      const result = await service.findOne('org_1');

      expect(result).toEqual(mockOrg);
      expect(orgFindFirst).toHaveBeenCalledWith({
        where: { id: 'org_1', deletedAt: null },
        include: { _count: { select: { applications: true, memberships: true } } },
      });
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      orgFindFirst.mockResolvedValue(null);

      await expect(service.findOne('org_unknown')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('org_unknown')).rejects.toThrow(
        'Organization "org_unknown" not found',
      );
    });

    it('should throw NotFoundException if organization is soft-deleted', async () => {
      orgFindFirst.mockResolvedValue(null);

      await expect(service.findOne('org_deleted')).rejects.toThrow(NotFoundException);
    });

    it('should exclude soft-deleted organizations from search', async () => {
      orgFindFirst.mockResolvedValue(null);

      await expect(service.findOne('org_1')).rejects.toThrow();

      expect(orgFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });

    it('should include entity counts in response', async () => {
      orgFindFirst.mockResolvedValue(mockOrg);

      const result = await service.findOne('org_1');

      expect(result._count).toEqual({ applications: 5, memberships: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe('update', () => {
    it('should update an organization', async () => {
      const dto = { name: 'Acme Corp Updated' };
      const updated = makeOrgMock({ name: 'Acme Corp Updated' });

      orgFindFirst.mockResolvedValue(mockOrg);
      orgUpdate.mockResolvedValue(updated);

      const result = await service.update('org_1', dto);

      expect(result.name).toBe('Acme Corp Updated');
      expect(orgUpdate).toHaveBeenCalledWith({
        where: { id: 'org_1' },
        data: dto,
        include: { _count: { select: { applications: true, memberships: true } } },
      });
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      const dto = { name: 'Updated' };
      orgFindFirst.mockResolvedValue(null);

      await expect(service.update('org_unknown', dto)).rejects.toThrow(NotFoundException);
    });

    it('should update slug if new slug is unique', async () => {
      const dto = { slug: 'new-slug' };
      const updated = makeOrgMock({ slug: 'new-slug' });

      orgFindFirst
        .mockResolvedValueOnce(mockOrg) // findOne check
        .mockResolvedValueOnce(null); // slug uniqueness check

      orgUpdate.mockResolvedValue(updated);

      const result = await service.update('org_1', dto);

      expect(result.slug).toBe('new-slug');
    });

    it('should throw ConflictException if new slug already exists', async () => {
      const dto = { slug: 'existing-slug' };
      const existingOrg = makeOrgMock({ id: 'org_2', slug: 'existing-slug' });

      orgFindFirst
        .mockResolvedValueOnce(mockOrg) // findOne
        .mockResolvedValueOnce(existingOrg); // slug check

      await expect(service.update('org_1', dto)).rejects.toThrow(
        new ConflictException('Organization with slug "existing-slug" already exists'),
      );
    });

    it('should allow slug update if same org (no conflict with self)', async () => {
      const dto = { slug: 'new-slug' };
      orgFindFirst
        .mockResolvedValueOnce(mockOrg)
        .mockResolvedValueOnce(null);

      orgUpdate.mockResolvedValue(makeOrgMock({ slug: 'new-slug' }));

      await service.update('org_1', dto);

      // Should check for OTHER orgs with the same slug (not current org)
      expect(orgFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'org_1' },
          }),
        }),
      );
    });

    it('should allow empty updates', async () => {
      const dto = {};
      orgFindFirst.mockResolvedValue(mockOrg);
      orgUpdate.mockResolvedValue(mockOrg);

      const result = await service.update('org_1', dto);

      expect(result).toEqual(mockOrg);
      expect(orgUpdate).toHaveBeenCalledWith({
        where: { id: 'org_1' },
        data: {},
        include: { _count: { select: { applications: true, memberships: true } } },
      });
    });

    it('should include entity counts in response', async () => {
      const dto = { name: 'Updated' };
      orgFindFirst.mockResolvedValue(mockOrg);
      orgUpdate.mockResolvedValue(mockOrg);

      const result = await service.update('org_1', dto);

      expect(result._count).toEqual({ applications: 5, memberships: 3 });
    });

    it('should throw ForbiddenException when updating name/slug of system org', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const systemOrg = { ...mockOrg, isSystem: true } as any;
      orgFindFirst.mockResolvedValue(systemOrg);

      await expect(service.update('org_1', { name: 'New Name' })).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update('org_1', { slug: 'new-slug' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow non-name/slug updates on system org', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const systemOrg = { ...mockOrg, isSystem: true } as any;
      orgFindFirst.mockResolvedValue(systemOrg);
      orgUpdate.mockResolvedValue(systemOrg);

      // plan update should not throw
      await expect(service.update('org_1', { plan: 'enterprise' })).resolves.toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------

  describe('remove', () => {
    it('should soft-delete an organization via transaction', async () => {
      const deleted = makeOrgMock({ deletedAt: new Date() });
      orgFindFirst.mockResolvedValue(mockOrg);
      txOrgUpdate.mockResolvedValue(deleted);
      txOrgMembershipFindMany.mockResolvedValue([]);

      const result = await service.remove('org_1');

      expect(result.deletedAt).not.toBeNull();
      expect(prismaTransaction).toHaveBeenCalled();
      expect(txOrgUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'org_1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      orgFindFirst.mockResolvedValue(null);

      await expect(service.remove('org_unknown')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deleting a system org', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const systemOrg = { ...mockOrg, isSystem: true } as any;
      orgFindFirst.mockResolvedValue(systemOrg);

      await expect(service.remove('org_1')).rejects.toThrow(ForbiddenException);
    });

    it('should include entity counts in response', async () => {
      const deleted = makeOrgMock({ deletedAt: new Date() });
      orgFindFirst.mockResolvedValue(mockOrg);
      txOrgUpdate.mockResolvedValue(deleted);
      txOrgMembershipFindMany.mockResolvedValue([]);

      const result = await service.remove('org_1');

      expect(result._count).toEqual({ applications: 5, memberships: 3 });
    });

    it('should invalidate sessions for users with no other orgs', async () => {
      const deleted = makeOrgMock({ deletedAt: new Date() });
      orgFindFirst.mockResolvedValue(mockOrg);
      txOrgUpdate.mockResolvedValue(deleted);

      // Two members: user_a has no other orgs, user_b does
      txOrgMembershipFindMany.mockResolvedValue([{ userId: 'user_a' }, { userId: 'user_b' }]);
      // groupBy returns users who DO have other orgs (user_b)
      txOrgMembershipGroupBy.mockResolvedValue([{ userId: 'user_b' }]);

      await service.remove('org_1', 'user_current');

      expect(txSessionDeleteMany).toHaveBeenCalledTimes(1);
      expect(txSessionDeleteMany).toHaveBeenCalledWith({
        where: { userId: { in: ['user_a'] } },
      });
    });

    it('should not invalidate sessions when currentUserId is undefined', async () => {
      const deleted = makeOrgMock({ deletedAt: new Date() });
      orgFindFirst.mockResolvedValue(mockOrg);
      txOrgUpdate.mockResolvedValue(deleted);
      txOrgMembershipFindMany.mockResolvedValue([]);

      await service.remove('org_1'); // no currentUserId

      // No session deletion attempted when no currentUserId provided
      expect(txOrgMembershipFindMany).not.toHaveBeenCalled();
      expect(txSessionDeleteMany).not.toHaveBeenCalled();
    });

    it('should fire audit log on successful delete', async () => {
      const deleted = makeOrgMock({ deletedAt: new Date() });
      orgFindFirst.mockResolvedValue(mockOrg);
      txOrgUpdate.mockResolvedValue(deleted);
      txOrgMembershipFindMany.mockResolvedValue([]);

      await service.remove('org_1');

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'org.delete' }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // slugify (tested via create)
  // ---------------------------------------------------------------------------

  describe('slugify (private)', () => {
    it('should convert name to lowercase and replace spaces with hyphens', async () => {
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(makeOrgMock({ slug: 'test-organization' }));

      await service.create({ name: 'Test Organization' });

      expect(orgCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'test-organization' }),
        }),
      );
    });

    it('should handle multiple consecutive spaces', async () => {
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(makeOrgMock({ slug: 'test-org' }));

      await service.create({ name: 'Test   Org' });

      expect(orgCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'test-org' }),
        }),
      );
    });

    it('should remove special characters and keep only alphanumeric + hyphens', async () => {
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(makeOrgMock({ slug: 'acme-corp-inc' }));

      await service.create({ name: 'Acme Corp, Inc.' });

      expect(orgCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'acme-corp-inc' }),
        }),
      );
    });

    it('should remove leading and trailing hyphens', async () => {
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(makeOrgMock({ slug: 'test' }));

      await service.create({ name: '---Test---' });

      expect(orgCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'test' }),
        }),
      );
    });

    it('should handle unicode and special chars', async () => {
      orgFindUnique.mockResolvedValue(null);
      orgCreate.mockResolvedValue(makeOrgMock({ slug: 'acme-corp' }));

      await service.create({ name: 'Acme & Corp!' });

      expect(orgCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'acme-corp' }),
        }),
      );
    });
  });
});
