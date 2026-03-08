import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrgService } from '../org.service';
import { PrismaService } from '../../../common/prisma';

describe('OrgService', () => {
  let service: OrgService;
  let prisma: jest.Mocked<PrismaService>;

  const mockOrg = {
    id: 'org_1',
    name: 'Acme Corp',
    slug: 'acme-corp',
    plan: 'pro',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    _count: { applications: 5, memberships: 3 },
  };

  const mockOrgDeleted = {
    ...mockOrg,
    deletedAt: new Date('2026-02-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgService,
        {
          provide: PrismaService,
          useValue: {
            organization: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrgService>(OrgService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an organization with auto-slugified name', async () => {
      const dto = { name: 'Acme Corp' };
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue(mockOrg);

      const result = await service.create(dto);

      expect(result.slug).toBe('acme-corp');
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme-corp' },
      });
      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: 'Acme Corp',
          slug: 'acme-corp',
          plan: 'free',
        },
        include: {
          _count: { select: { applications: true, memberships: true } },
        },
      });
    });

    it('should create an organization with custom slug', async () => {
      const dto = { name: 'Acme Corp', slug: 'custom-slug' };
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        ...mockOrg,
        slug: 'custom-slug',
      });

      const result = await service.create(dto);

      expect(result.slug).toBe('custom-slug');
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'custom-slug' },
      });
    });

    it('should create an organization with specified plan', async () => {
      const dto = { name: 'Acme Corp', plan: 'pro' };
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue(mockOrg);

      await service.create(dto);

      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ plan: 'pro' }),
        }),
      );
    });

    it('should default plan to "free" if not provided', async () => {
      const dto = { name: 'Acme Corp' };
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        ...mockOrg,
        plan: 'free',
      });

      await service.create(dto);

      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ plan: 'free' }),
        }),
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      const dto = { name: 'Acme Corp' };
      prisma.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        'Organization with slug "acme-corp" already exists',
      );
    });

    it('should throw ConflictException if custom slug already exists', async () => {
      const dto = { name: 'Acme Corp', slug: 'existing-slug' };
      prisma.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should include entity counts in response', async () => {
      const dto = { name: 'Acme Corp' };
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue(mockOrg);

      const result = await service.create(dto);

      expect(result._count).toEqual({ applications: 5, memberships: 3 });
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted organizations ordered by createdAt desc', async () => {
      const orgs = [mockOrg, { ...mockOrg, id: 'org_2', name: 'Beta Inc' }];
      prisma.organization.findMany.mockResolvedValue(orgs);

      const result = await service.findAll();

      expect(result).toEqual(orgs);
      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          _count: { select: { applications: true, memberships: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should exclude soft-deleted organizations', async () => {
      prisma.organization.findMany.mockResolvedValue([mockOrg]);

      await service.findAll();

      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
    });

    it('should return empty array when no organizations exist', async () => {
      prisma.organization.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should include entity counts in each organization', async () => {
      prisma.organization.findMany.mockResolvedValue([mockOrg]);

      const result = await service.findAll();

      expect(result[0]._count).toEqual({ applications: 5, memberships: 3 });
    });
  });

  describe('findOne', () => {
    it('should return an organization by id', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);

      const result = await service.findOne('org_1');

      expect(result).toEqual(mockOrg);
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: { id: 'org_1', deletedAt: null },
        include: {
          _count: { select: { applications: true, memberships: true } },
        },
      });
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org_unknown')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('org_unknown')).rejects.toThrow(
        'Organization "org_unknown" not found',
      );
    });

    it('should throw NotFoundException if organization is soft-deleted', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org_deleted')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should exclude soft-deleted organizations from search', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org_1')).rejects.toThrow();

      expect(prisma.organization.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });

    it('should include entity counts in response', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);

      const result = await service.findOne('org_1');

      expect(result._count).toEqual({ applications: 5, memberships: 3 });
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      const dto = { name: 'Acme Corp Updated' };
      const updated = { ...mockOrg, name: 'Acme Corp Updated' };

      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organization.update.mockResolvedValue(updated);

      const result = await service.update('org_1', dto);

      expect(result.name).toBe('Acme Corp Updated');
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org_1' },
        data: dto,
        include: {
          _count: { select: { applications: true, memberships: true } },
        },
      });
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      const dto = { name: 'Updated' };
      prisma.organization.findFirst.mockResolvedValue(null);

      await expect(service.update('org_unknown', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update slug if new slug is unique', async () => {
      const dto = { slug: 'new-slug' };
      const updated = { ...mockOrg, slug: 'new-slug' };

      prisma.organization.findFirst
        .mockResolvedValueOnce(mockOrg) // First call: findOne in update
        .mockResolvedValueOnce(null); // Second call: slug uniqueness check

      prisma.organization.update.mockResolvedValue(updated);

      const result = await service.update('org_1', dto);

      expect(result.slug).toBe('new-slug');
    });

    it('should throw ConflictException if new slug already exists', async () => {
      const dto = { slug: 'existing-slug' };
      const existingOrg = { ...mockOrg, id: 'org_2', slug: 'existing-slug' };

      prisma.organization.findFirst
        .mockResolvedValueOnce(mockOrg) // First call: findOne
        .mockResolvedValueOnce(existingOrg); // Second call: slug check

      await expect(service.update('org_1', dto)).rejects.toThrow(
        new ConflictException('Organization with slug "existing-slug" already exists'),
      );
    });

    it('should allow slug update if same org', async () => {
      const dto = { slug: 'new-slug' };
      prisma.organization.findFirst
        .mockResolvedValueOnce(mockOrg)
        .mockResolvedValueOnce(null);

      prisma.organization.update.mockResolvedValue({
        ...mockOrg,
        slug: 'new-slug',
      });

      await service.update('org_1', dto);

      // Should check for other orgs with the same slug
      expect(prisma.organization.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'org_1' },
          }),
        }),
      );
    });

    it('should allow empty updates', async () => {
      const dto = {};
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organization.update.mockResolvedValue(mockOrg);

      const result = await service.update('org_1', dto);

      expect(result).toEqual(mockOrg);
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org_1' },
        data: {},
        include: {
          _count: { select: { applications: true, memberships: true } },
        },
      });
    });

    it('should include entity counts in response', async () => {
      const dto = { name: 'Updated' };
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organization.update.mockResolvedValue(mockOrg);

      const result = await service.update('org_1', dto);

      expect(result._count).toEqual({ applications: 5, memberships: 3 });
    });
  });

  describe('remove', () => {
    it('should soft-delete an organization by setting deletedAt', async () => {
      const deleted = { ...mockOrg, deletedAt: new Date() };
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organization.update.mockResolvedValue(deleted);

      const result = await service.remove('org_1');

      expect(result.deletedAt).not.toBeNull();
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org_1' },
        data: { deletedAt: expect.any(Date) },
        include: {
          _count: { select: { applications: true, memberships: true } },
        },
      });
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);

      await expect(service.remove('org_unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include entity counts in response', async () => {
      const deleted = { ...mockOrg, deletedAt: new Date() };
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organization.update.mockResolvedValue(deleted);

      const result = await service.remove('org_1');

      expect(result._count).toEqual({ applications: 5, memberships: 3 });
    });

    it('should use findOne to validate org exists before deletion', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organization.update.mockResolvedValue({
        ...mockOrg,
        deletedAt: new Date(),
      });

      await service.remove('org_1');

      // findFirst should be called first to check existence
      expect(prisma.organization.findFirst).toHaveBeenCalled();
    });
  });

  describe('slugify (private)', () => {
    it('should convert name to lowercase and replace spaces with hyphens', async () => {
      // Test via the create method since slugify is private
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        ...mockOrg,
        slug: 'test-organization',
      });

      await service.create({ name: 'Test Organization' });

      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'test-organization' }),
        }),
      );
    });

    it('should handle multiple consecutive spaces', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        ...mockOrg,
        slug: 'test-org',
      });

      await service.create({ name: 'Test   Org' });

      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'test-org' }),
        }),
      );
    });

    it('should remove special characters and keep only alphanumeric + hyphens', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        ...mockOrg,
        slug: 'acme-corp-inc',
      });

      await service.create({ name: 'Acme Corp, Inc.' });

      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'acme-corp-inc' }),
        }),
      );
    });

    it('should remove leading and trailing hyphens', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        ...mockOrg,
        slug: 'test',
      });

      await service.create({ name: '---Test---' });

      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'test' }),
        }),
      );
    });

    it('should handle unicode and special chars', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        ...mockOrg,
        slug: 'acme-corp',
      });

      await service.create({ name: 'Acme & Corp!' });

      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'acme-corp' }),
        }),
      );
    });
  });
});
