import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CodexContentService } from '../codex-content.service';
import { PrismaService } from '../../../common/prisma';
import { CODEX_VERSION_STATUS, CONTENT_TREE_RULES, CodexVersionStatus } from '@heimdal/shared';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const makeScreen = (versionStatus: CodexVersionStatus = CODEX_VERSION_STATUS.DRAFT) => ({
  id: 'scr_1',
  versionId: 'cxv_1',
  slug: 'home',
  name: 'Home',
  description: null,
  sortOrder: 0,
  screenType: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  version: { status: versionStatus },
});

const makeContent = (overrides: Record<string, unknown> = {}) => ({
  id: 'cxc_1',
  screenId: 'scr_1',
  locale: 'en',
  contentTree: { title: 'Hello', body: 'World' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

// Build a content tree of a specific depth for testing maxDepth rules.
// maxDepth is 3 in CONTENT_TREE_RULES (depth 0, 1, 2 are OK; nesting at depth 3 is invalid)
function buildNestedTree(depth: number): Record<string, unknown> {
  if (depth === 0) return { leaf: 'value' };
  return { nested: buildNestedTree(depth - 1) };
}

describe('CodexContentService', () => {
  let service: CodexContentService;

  const screenFindUnique = jest.fn();
  const screenFindMany = jest.fn();
  const contentFindUnique = jest.fn();
  const contentUpsert = jest.fn();
  const contentDelete = jest.fn();

  const prismaMock = {
    codexScreen: {
      findUnique: screenFindUnique,
      findMany: screenFindMany,
    },
    codexContent: {
      findUnique: contentFindUnique,
      upsert: contentUpsert,
      delete: contentDelete,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodexContentService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CodexContentService>(CodexContentService);
  });

  // ── getContent ────────────────────────────────────────────────────────────

  describe('getContent', () => {
    it('returns content when found', async () => {
      contentFindUnique.mockResolvedValue(makeContent());

      const result = await service.getContent('scr_1', 'en');

      expect(contentFindUnique).toHaveBeenCalledWith({
        where: { screenId_locale: { screenId: 'scr_1', locale: 'en' } },
      });
      expect(result.locale).toBe('en');
    });

    it('throws NotFoundException when content not found', async () => {
      contentFindUnique.mockResolvedValue(null);

      await expect(service.getContent('scr_1', 'fr')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateContent (upsert) ────────────────────────────────────────────────

  describe('updateContent', () => {
    it('creates content when it does not exist (happy path)', async () => {
      screenFindUnique.mockResolvedValue(makeScreen(CODEX_VERSION_STATUS.DRAFT));
      const content = makeContent({ locale: 'en', contentTree: { title: 'Hi' } });
      contentUpsert.mockResolvedValue(content);

      const result = await service.updateContent('scr_1', {
        locale: 'en',
        contentTree: { title: 'Hi' },
      });

      expect(contentUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { screenId_locale: { screenId: 'scr_1', locale: 'en' } },
          create: expect.objectContaining({ locale: 'en' }),
          update: expect.objectContaining({ contentTree: { title: 'Hi' } }),
        }),
      );
      expect(result.locale).toBe('en');
    });

    it('updates existing content when it already exists', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      const updated = makeContent({ contentTree: { title: 'Updated' } });
      contentUpsert.mockResolvedValue(updated);

      await service.updateContent('scr_1', {
        locale: 'en',
        contentTree: { title: 'Updated' },
      });

      expect(contentUpsert).toHaveBeenCalled();
    });

    it('throws NotFoundException when screen not found', async () => {
      screenFindUnique.mockResolvedValue(null);

      await expect(
        service.updateContent('missing', { locale: 'en', contentTree: { title: 'x' } }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when screen version is not DRAFT', async () => {
      screenFindUnique.mockResolvedValue(makeScreen(CODEX_VERSION_STATUS.PUBLISHED));

      await expect(
        service.updateContent('scr_1', { locale: 'en', contentTree: { title: 'x' } }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when content tree has reserved key _codex', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());

      await expect(
        service.updateContent('scr_1', {
          locale: 'en',
          contentTree: { _codex: 'forbidden' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when content tree has non-camelCase key', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());

      await expect(
        service.updateContent('scr_1', {
          locale: 'en',
          contentTree: { 'snake_case_key': 'value' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when a value exceeds maxValueLength', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      const longValue = 'x'.repeat(CONTENT_TREE_RULES.maxValueLength + 1);

      await expect(
        service.updateContent('scr_1', {
          locale: 'en',
          contentTree: { title: longValue },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when content tree exceeds max depth', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      // maxDepth is 3, so depth 4 nesting should fail
      const tooDeep = buildNestedTree(CONTENT_TREE_RULES.maxDepth + 1);

      await expect(
        service.updateContent('scr_1', {
          locale: 'en',
          contentTree: tooDeep,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts content tree at exactly max depth (depth boundary)', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      contentUpsert.mockResolvedValue(makeContent());
      // maxDepth is 3 — depth 2 nesting should be accepted (0-indexed levels: 0,1,2)
      const atMaxDepth = buildNestedTree(CONTENT_TREE_RULES.maxDepth - 1);

      await expect(
        service.updateContent('scr_1', {
          locale: 'en',
          contentTree: atMaxDepth,
        }),
      ).resolves.not.toThrow();
    });
  });

  // ── patchContent (deep merge) ─────────────────────────────────────────────

  describe('patchContent', () => {
    it('merges patch with existing content tree', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      contentFindUnique.mockResolvedValue(
        makeContent({ contentTree: { title: 'Old', body: 'Keep' } }),
      );
      const merged = makeContent({ contentTree: { title: 'New', body: 'Keep' } });
      contentUpsert.mockResolvedValue(merged);

      const result = await service.patchContent('scr_1', 'en', { title: 'New' });

      // The upsert should be called with the merged tree
      expect(contentUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ contentTree: { title: 'New', body: 'Keep' } }),
          update: expect.objectContaining({ contentTree: { title: 'New', body: 'Keep' } }),
        }),
      );
      expect(result.contentTree).toEqual({ title: 'New', body: 'Keep' });
    });

    it('uses patch as full tree when no existing content', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      contentFindUnique.mockResolvedValue(null);
      contentUpsert.mockResolvedValue(makeContent({ contentTree: { title: 'New' } }));

      await service.patchContent('scr_1', 'en', { title: 'New' });

      expect(contentUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ contentTree: { title: 'New' } }),
        }),
      );
    });

    it('deep merges nested objects', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      contentFindUnique.mockResolvedValue(
        makeContent({
          contentTree: {
            hero: { title: 'Old Title', subtitle: 'Keep' },
          },
        }),
      );
      const expectedMerged = { hero: { title: 'New Title', subtitle: 'Keep' } };
      contentUpsert.mockResolvedValue(makeContent({ contentTree: expectedMerged }));

      await service.patchContent('scr_1', 'en', { hero: { title: 'New Title' } });

      expect(contentUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ contentTree: expectedMerged }),
        }),
      );
    });

    it('throws ForbiddenException when screen version is not DRAFT', async () => {
      screenFindUnique.mockResolvedValue(makeScreen(CODEX_VERSION_STATUS.REVIEW));

      await expect(service.patchContent('scr_1', 'en', { title: 'x' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when merged tree has invalid keys', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      contentFindUnique.mockResolvedValue(null);

      await expect(
        service.patchContent('scr_1', 'en', { 'bad-key': 'value' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── deleteContent ─────────────────────────────────────────────────────────

  describe('deleteContent', () => {
    it('deletes content for a locale', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      contentFindUnique.mockResolvedValue(makeContent());
      contentDelete.mockResolvedValue(undefined);

      await service.deleteContent('scr_1', 'en');

      expect(contentDelete).toHaveBeenCalledWith({
        where: { screenId_locale: { screenId: 'scr_1', locale: 'en' } },
      });
    });

    it('throws NotFoundException when content does not exist', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      contentFindUnique.mockResolvedValue(null);

      await expect(service.deleteContent('scr_1', 'fr')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when screen version is not DRAFT', async () => {
      screenFindUnique.mockResolvedValue(makeScreen(CODEX_VERSION_STATUS.PUBLISHED));

      await expect(service.deleteContent('scr_1', 'en')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── getMergedContent ──────────────────────────────────────────────────────

  describe('getMergedContent', () => {
    it('merges content trees by screen slug, stripping _meta', async () => {
      screenFindMany.mockResolvedValue([
        {
          slug: 'home',
          sortOrder: 0,
          contents: [
            {
              locale: 'en',
              contentTree: { _meta: { screenType: 'tab' }, title: 'Home', body: 'Welcome' },
            },
          ],
        },
        {
          slug: 'profile',
          sortOrder: 1,
          contents: [{ locale: 'en', contentTree: { heading: 'Your Profile' } }],
        },
      ]);

      const result = await service.getMergedContent('cxv_1', 'en');

      expect(result).toEqual({
        home: { title: 'Home', body: 'Welcome' },
        profile: { heading: 'Your Profile' },
      });
    });

    it('skips screens with no content for the requested locale', async () => {
      screenFindMany.mockResolvedValue([
        { slug: 'home', sortOrder: 0, contents: [] },
        {
          slug: 'settings',
          sortOrder: 1,
          contents: [{ locale: 'en', contentTree: { key: 'val' } }],
        },
      ]);

      const result = await service.getMergedContent('cxv_1', 'en');

      expect(result).toEqual({ settings: { key: 'val' } });
      expect(result).not.toHaveProperty('home');
    });

    it('filters by screenSlugs when provided', async () => {
      screenFindMany.mockResolvedValue([
        {
          slug: 'home',
          sortOrder: 0,
          contents: [{ locale: 'en', contentTree: { title: 'Home' } }],
        },
      ]);

      await service.getMergedContent('cxv_1', 'en', ['home']);

      expect(screenFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            slug: { in: ['home'] },
          }),
        }),
      );
    });

    it('does not filter by slug when screenSlugs is empty array', async () => {
      screenFindMany.mockResolvedValue([]);

      await service.getMergedContent('cxv_1', 'en', []);

      // When empty array, the where clause should NOT have slug filter
      expect(screenFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ versionId: 'cxv_1' }),
        }),
      );
    });
  });

  // ── validateContentTree (edge cases via updateContent) ────────────────────

  describe('validateContentTree edge cases', () => {
    it('accepts _meta key without treating it as a reserved key violation', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());
      contentUpsert.mockResolvedValue(makeContent());

      // _meta is skipped by enforceKeyPattern — should not throw
      await expect(
        service.updateContent('scr_1', {
          locale: 'en',
          contentTree: { _meta: { screenType: 'tab', aiConfidence: 0.9, lastModified: 'now' } },
        }),
      ).resolves.not.toThrow();
    });

    it('throws BadRequestException when key starts with a number', async () => {
      screenFindUnique.mockResolvedValue(makeScreen());

      await expect(
        service.updateContent('scr_1', {
          locale: 'en',
          contentTree: { '1invalid': 'value' },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
