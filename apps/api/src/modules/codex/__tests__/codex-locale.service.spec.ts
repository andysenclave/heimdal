import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CodexLocaleService } from '../codex-locale.service';
import { PrismaService } from '../../../common/prisma';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const makeLocale = (overrides: Record<string, unknown> = {}) => ({
  id: 'cxl_1',
  appId: 'app_1',
  locale: 'en',
  name: 'English',
  isBase: true,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('CodexLocaleService', () => {
  let service: CodexLocaleService;

  const appFindUnique = jest.fn();
  const localeFindUnique = jest.fn();
  const localeFindFirst = jest.fn();
  const localeFindMany = jest.fn();
  const localeCreate = jest.fn();
  const localeUpdate = jest.fn();
  const localeUpdateMany = jest.fn();
  const localeDelete = jest.fn();
  const localeCount = jest.fn();

  const prismaMock = {
    application: {
      findUnique: appFindUnique,
    },
    codexLocale: {
      findUnique: localeFindUnique,
      findFirst: localeFindFirst,
      findMany: localeFindMany,
      create: localeCreate,
      update: localeUpdate,
      updateMany: localeUpdateMany,
      delete: localeDelete,
      count: localeCount,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodexLocaleService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CodexLocaleService>(CodexLocaleService);
  });

  // ── createLocale ──────────────────────────────────────────────────────────

  describe('createLocale', () => {
    it('creates a locale when app exists and locale is not a duplicate', async () => {
      appFindUnique.mockResolvedValue({ id: 'app_1' });
      localeFindUnique.mockResolvedValue(null); // no duplicate
      localeCount.mockResolvedValue(0); // first locale, auto-becomes base
      const created = makeLocale({ locale: 'en', isBase: true });
      localeCreate.mockResolvedValue(created);

      const result = await service.createLocale('app_1', {
        locale: 'en',
        name: 'English',
        isBase: undefined,
      });

      expect(localeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appId: 'app_1',
            locale: 'en',
            name: 'English',
            isBase: true, // auto-set because count === 0
            isActive: true,
          }),
        }),
      );
      expect(result.locale).toBe('en');
    });

    it('does not auto-set isBase when other locales already exist', async () => {
      appFindUnique.mockResolvedValue({ id: 'app_1' });
      localeFindUnique.mockResolvedValue(null);
      localeCount.mockResolvedValue(1); // already has a locale
      const created = makeLocale({ locale: 'fr', isBase: false });
      localeCreate.mockResolvedValue(created);

      await service.createLocale('app_1', {
        locale: 'fr',
        name: 'French',
        isBase: undefined,
      });

      expect(localeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isBase: false }),
        }),
      );
    });

    it('demotes existing base locale when new locale is explicitly set as base', async () => {
      appFindUnique.mockResolvedValue({ id: 'app_1' });
      localeFindUnique.mockResolvedValue(null);
      localeUpdateMany.mockResolvedValue({ count: 1 });
      localeCount.mockResolvedValue(1);
      localeCreate.mockResolvedValue(makeLocale({ locale: 'fr', isBase: true }));

      await service.createLocale('app_1', {
        locale: 'fr',
        name: 'French',
        isBase: true,
      });

      expect(localeUpdateMany).toHaveBeenCalledWith({
        where: { appId: 'app_1', isBase: true },
        data: { isBase: false },
      });
    });

    it('throws NotFoundException when app does not exist', async () => {
      appFindUnique.mockResolvedValue(null);

      await expect(
        service.createLocale('missing', { locale: 'en', name: 'English', isBase: undefined }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when locale already configured for this app', async () => {
      appFindUnique.mockResolvedValue({ id: 'app_1' });
      localeFindUnique.mockResolvedValue(makeLocale()); // duplicate

      await expect(
        service.createLocale('app_1', { locale: 'en', name: 'English', isBase: undefined }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── listLocales ───────────────────────────────────────────────────────────

  describe('listLocales', () => {
    it('returns locales ordered by isBase desc, locale asc', async () => {
      const locales = [
        makeLocale({ locale: 'en', isBase: true }),
        makeLocale({ id: 'cxl_2', locale: 'fr', isBase: false }),
      ];
      localeFindMany.mockResolvedValue(locales);

      const result = await service.listLocales('app_1');

      expect(localeFindMany).toHaveBeenCalledWith({
        where: { appId: 'app_1' },
        orderBy: [{ isBase: 'desc' }, { locale: 'asc' }],
      });
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no locales configured', async () => {
      localeFindMany.mockResolvedValue([]);
      const result = await service.listLocales('app_1');
      expect(result).toEqual([]);
    });
  });

  // ── updateLocale ──────────────────────────────────────────────────────────

  describe('updateLocale', () => {
    it('updates locale name and isActive', async () => {
      localeFindUnique.mockResolvedValue(makeLocale());
      const updated = makeLocale({ name: 'English (US)', isActive: false });
      localeUpdate.mockResolvedValue(updated);

      const result = await service.updateLocale('cxl_1', { name: 'English (US)', isActive: false });

      expect(localeUpdate).toHaveBeenCalledWith({
        where: { id: 'cxl_1' },
        data: { name: 'English (US)', isActive: false },
      });
      expect(result.name).toBe('English (US)');
    });

    it('throws NotFoundException when locale does not exist', async () => {
      localeFindUnique.mockResolvedValue(null);

      await expect(service.updateLocale('missing', { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── deleteLocale ──────────────────────────────────────────────────────────

  describe('deleteLocale', () => {
    it('deletes a non-base locale', async () => {
      localeFindUnique.mockResolvedValue(makeLocale({ isBase: false, locale: 'fr' }));
      localeDelete.mockResolvedValue(undefined);

      await service.deleteLocale('cxl_fr');

      expect(localeDelete).toHaveBeenCalledWith({ where: { id: 'cxl_fr' } });
    });

    it('throws NotFoundException when locale does not exist', async () => {
      localeFindUnique.mockResolvedValue(null);

      await expect(service.deleteLocale('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when trying to delete the base locale', async () => {
      localeFindUnique.mockResolvedValue(makeLocale({ isBase: true }));

      await expect(service.deleteLocale('cxl_1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── getBaseLocale ─────────────────────────────────────────────────────────

  describe('getBaseLocale', () => {
    it('returns the base locale for an app', async () => {
      localeFindFirst.mockResolvedValue(makeLocale({ isBase: true }));

      const result = await service.getBaseLocale('app_1');

      expect(localeFindFirst).toHaveBeenCalledWith({
        where: { appId: 'app_1', isBase: true },
      });
      expect(result.isBase).toBe(true);
    });

    it('throws NotFoundException when no base locale is configured', async () => {
      localeFindFirst.mockResolvedValue(null);

      await expect(service.getBaseLocale('app_1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── ensureBaseLocale ──────────────────────────────────────────────────────

  describe('ensureBaseLocale', () => {
    it('returns existing base locale when already configured', async () => {
      const existing = makeLocale({ locale: 'en', isBase: true });
      localeFindFirst.mockResolvedValue(existing);

      const result = await service.ensureBaseLocale('app_1');

      expect(result).toBe(existing);
      expect(localeCreate).not.toHaveBeenCalled();
    });

    it('auto-creates "en" as base locale when none exists', async () => {
      localeFindFirst.mockResolvedValue(null);
      const created = makeLocale({ locale: 'en', isBase: true });
      localeCreate.mockResolvedValue(created);

      const result = await service.ensureBaseLocale('app_1');

      expect(localeCreate).toHaveBeenCalledWith({
        data: {
          appId: 'app_1',
          locale: 'en',
          name: 'English',
          isBase: true,
          isActive: true,
        },
      });
      expect(result.locale).toBe('en');
    });

    it('does not create a new locale if a non-en base locale already exists', async () => {
      localeFindFirst.mockResolvedValue(makeLocale({ locale: 'fr', isBase: true }));

      const result = await service.ensureBaseLocale('app_1');

      expect(localeCreate).not.toHaveBeenCalled();
      expect(result.locale).toBe('fr');
    });
  });
});
