import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CodexScreenService } from '../codex-screen.service';
import { PrismaService } from '../../../common/prisma';
import { CODEX_VERSION_STATUS, CodexVersionStatus } from '@heimdal/shared';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const makeVersion = (status: CodexVersionStatus = CODEX_VERSION_STATUS.DRAFT) => ({
  id: 'cxv_1',
  appId: 'app_1',
  orgId: 'org_1',
  status,
  version: 1,
  description: null,
  createdById: 'user_1',
  reviewedById: null,
  reviewedAt: null,
  publishedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const makeScreen = (overrides: Record<string, unknown> = {}) => ({
  id: 'scr_1',
  versionId: 'cxv_1',
  slug: 'home',
  name: 'Home Screen',
  description: null,
  screenType: null,
  sortOrder: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  image: null,
  _count: { regions: 0 },
  contents: [],
  version: makeVersion(),
  ...overrides,
});

describe('CodexScreenService', () => {
  let service: CodexScreenService;

  const versionFindUnique = jest.fn();
  const screenFindUnique = jest.fn();
  const screenFindMany = jest.fn();
  const screenCreate = jest.fn();
  const screenUpdate = jest.fn();
  const screenDelete = jest.fn();
  const screenAggregate = jest.fn();
  const transactionFn = jest.fn();

  const prismaMock = {
    codexVersion: {
      findUnique: versionFindUnique,
    },
    codexScreen: {
      findUnique: screenFindUnique,
      findMany: screenFindMany,
      create: screenCreate,
      update: screenUpdate,
      delete: screenDelete,
      aggregate: screenAggregate,
    },
    $transaction: transactionFn,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodexScreenService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CodexScreenService>(CodexScreenService);
  });

  // ── createScreen ──────────────────────────────────────────────────────────

  describe('createScreen', () => {
    it('creates a screen with auto-incremented sortOrder', async () => {
      versionFindUnique.mockResolvedValue(makeVersion(CODEX_VERSION_STATUS.DRAFT));
      screenFindUnique.mockResolvedValue(null); // no slug conflict
      screenAggregate.mockResolvedValue({ _max: { sortOrder: 2 } });

      const created = makeScreen({ slug: 'profile', sortOrder: 3 });
      screenCreate.mockResolvedValue(created);

      const result = await service.createScreen('cxv_1', {
        slug: 'profile',
        name: 'Profile',
        description: undefined,
      });

      expect(screenCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionId: 'cxv_1',
            slug: 'profile',
            name: 'Profile',
            sortOrder: 3,
          }),
        }),
      );
      expect(result.slug).toBe('profile');
    });

    it('uses sortOrder 0 when no screens exist yet (maxOrder is null)', async () => {
      versionFindUnique.mockResolvedValue(makeVersion(CODEX_VERSION_STATUS.DRAFT));
      screenFindUnique.mockResolvedValue(null);
      screenAggregate.mockResolvedValue({ _max: { sortOrder: null } });
      screenCreate.mockResolvedValue(makeScreen({ sortOrder: 0 }));

      await service.createScreen('cxv_1', { slug: 'home', name: 'Home', description: undefined });

      expect(screenCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sortOrder: 0 }),
        }),
      );
    });

    it('throws NotFoundException when version does not exist', async () => {
      versionFindUnique.mockResolvedValue(null);

      await expect(
        service.createScreen('missing', { slug: 'home', name: 'Home', description: undefined }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when version is not DRAFT', async () => {
      versionFindUnique.mockResolvedValue(makeVersion(CODEX_VERSION_STATUS.PUBLISHED));

      await expect(
        service.createScreen('cxv_1', { slug: 'home', name: 'Home', description: undefined }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when slug already exists in this version', async () => {
      versionFindUnique.mockResolvedValue(makeVersion(CODEX_VERSION_STATUS.DRAFT));
      screenFindUnique.mockResolvedValue(makeScreen()); // slug conflict

      await expect(
        service.createScreen('cxv_1', { slug: 'home', name: 'Duplicate', description: undefined }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── listScreens ───────────────────────────────────────────────────────────

  describe('listScreens', () => {
    it('returns screens ordered by sortOrder', async () => {
      versionFindUnique.mockResolvedValue(makeVersion());
      const screens = [
        makeScreen({ id: 'scr_1', sortOrder: 0 }),
        makeScreen({ id: 'scr_2', slug: 'settings', sortOrder: 1 }),
      ];
      screenFindMany.mockResolvedValue(screens);

      const result = await service.listScreens('cxv_1');

      expect(screenFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { versionId: 'cxv_1' },
          orderBy: { sortOrder: 'asc' },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('throws NotFoundException when version does not exist', async () => {
      versionFindUnique.mockResolvedValue(null);

      await expect(service.listScreens('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getScreen ─────────────────────────────────────────────────────────────

  describe('getScreen', () => {
    it('returns screen with regionCount and locales', async () => {
      screenFindUnique.mockResolvedValue(
        makeScreen({
          _count: { regions: 4 },
          contents: [{ locale: 'en' }, { locale: 'fr' }],
        }),
      );

      const result = await service.getScreen('scr_1');

      expect(result.regionCount).toBe(4);
      expect(result.locales).toEqual(['en', 'fr']);
    });

    it('throws NotFoundException when screen does not exist', async () => {
      screenFindUnique.mockResolvedValue(null);

      await expect(service.getScreen('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateScreen ──────────────────────────────────────────────────────────

  describe('updateScreen', () => {
    it('updates name and description for DRAFT screen', async () => {
      screenFindUnique.mockResolvedValue(makeScreen({ version: makeVersion() }));
      const updated = makeScreen({ name: 'New Name', description: 'New desc' });
      screenUpdate.mockResolvedValue(updated);

      const result = await service.updateScreen('scr_1', {
        name: 'New Name',
        description: 'New desc',
      });

      expect(screenUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'scr_1' },
          data: { name: 'New Name', description: 'New desc' },
        }),
      );
      expect(result.name).toBe('New Name');
    });

    it('throws NotFoundException when screen does not exist', async () => {
      screenFindUnique.mockResolvedValue(null);

      await expect(service.updateScreen('missing', { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when screen version is not DRAFT', async () => {
      screenFindUnique.mockResolvedValue(
        makeScreen({ version: makeVersion(CODEX_VERSION_STATUS.PUBLISHED) }),
      );

      await expect(service.updateScreen('scr_1', { name: 'x' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── deleteScreen ──────────────────────────────────────────────────────────

  describe('deleteScreen', () => {
    it('deletes screen in DRAFT version', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      screenDelete.mockResolvedValue(undefined);

      await service.deleteScreen('scr_1');

      expect(screenDelete).toHaveBeenCalledWith({ where: { id: 'scr_1' } });
    });

    it('throws NotFoundException when screen does not exist', async () => {
      screenFindUnique.mockResolvedValue(null);

      await expect(service.deleteScreen('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when screen version is not DRAFT', async () => {
      screenFindUnique.mockResolvedValue(
        makeScreen({ version: makeVersion(CODEX_VERSION_STATUS.REVIEW) }),
      );

      await expect(service.deleteScreen('scr_1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── reorderScreens ────────────────────────────────────────────────────────

  describe('reorderScreens', () => {
    it('updates sortOrder for each screen in order via transaction', async () => {
      versionFindUnique.mockResolvedValue(makeVersion(CODEX_VERSION_STATUS.DRAFT));
      transactionFn.mockResolvedValue([]);

      await service.reorderScreens('cxv_1', ['scr_a', 'scr_b', 'scr_c']);

      expect(transactionFn).toHaveBeenCalled();
    });

    it('throws NotFoundException when version does not exist', async () => {
      versionFindUnique.mockResolvedValue(null);

      await expect(service.reorderScreens('missing', ['scr_1'])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when version is not DRAFT', async () => {
      versionFindUnique.mockResolvedValue(makeVersion(CODEX_VERSION_STATUS.PUBLISHED));

      await expect(service.reorderScreens('cxv_1', ['scr_1'])).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
