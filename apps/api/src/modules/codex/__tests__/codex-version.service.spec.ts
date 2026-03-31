import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CodexVersionService } from '../codex-version.service';
import { PrismaService } from '../../../common/prisma';
import { CODEX_VERSION_STATUS } from '@heimdal/shared';
import type { CodexVersion } from '@prisma/client';

// ---------------------------------------------------------------------------
// Prisma mock helpers
// ---------------------------------------------------------------------------

type MockCodexVersion = CodexVersion & {
  _count?: { screens: number };
  createdBy?: { id: string; name: string | null; email: string };
  reviewedBy?: { id: string; name: string | null; email: string } | null;
};

const makeVersion = (overrides: Partial<MockCodexVersion> = {}): MockCodexVersion => ({
  id: 'cxv_1',
  appId: 'app_1',
  orgId: 'org_1',
  version: 1,
  status: CODEX_VERSION_STATUS.DRAFT,
  description: 'v1',
  createdById: 'user_1',
  reviewedById: null,
  reviewedAt: null,
  publishedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  _count: { screens: 0 },
  createdBy: { id: 'user_1', name: 'Alice', email: 'alice@test.com' },
  reviewedBy: null,
  ...overrides,
});

describe('CodexVersionService', () => {
  let service: CodexVersionService;

  const versionFindUnique = jest.fn();
  const versionFindMany = jest.fn();
  const versionFindFirst = jest.fn();
  const versionCreate = jest.fn();
  const versionUpdate = jest.fn();
  const versionUpdateMany = jest.fn();
  const versionDelete = jest.fn();
  const screenFindMany = jest.fn();
  const screenCreate = jest.fn();
  const contentCreateMany = jest.fn();
  const regionCreateMany = jest.fn();

  const prismaMock = {
    codexVersion: {
      findUnique: versionFindUnique,
      findMany: versionFindMany,
      findFirst: versionFindFirst,
      create: versionCreate,
      update: versionUpdate,
      updateMany: versionUpdateMany,
      delete: versionDelete,
    },
    codexScreen: {
      findMany: screenFindMany,
      create: screenCreate,
    },
    codexContent: {
      createMany: contentCreateMany,
    },
    codexRegion: {
      createMany: regionCreateMany,
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodexVersionService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CodexVersionService>(CodexVersionService);
  });

  // ── listVersions ──────────────────────────────────────────────────────────

  describe('listVersions', () => {
    it('returns all versions for an app, mapped with screenCount', async () => {
      const mockVersions = [makeVersion({ _count: { screens: 3 } })];
      versionFindMany.mockResolvedValue(mockVersions);

      const result = await service.listVersions('app_1');

      expect(versionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { appId: 'app_1' } }),
      );
      expect(result[0].screenCount).toBe(3);
    });

    it('returns empty array when no versions exist', async () => {
      versionFindMany.mockResolvedValue([]);
      const result = await service.listVersions('app_1');
      expect(result).toEqual([]);
    });
  });

  // ── getVersion ────────────────────────────────────────────────────────────

  describe('getVersion', () => {
    it('returns version with screenCount when found', async () => {
      versionFindUnique.mockResolvedValue(makeVersion({ _count: { screens: 5 } }));

      const result = await service.getVersion('cxv_1');

      expect(result.screenCount).toBe(5);
      expect(result.id).toBe('cxv_1');
    });

    it('throws NotFoundException when version not found', async () => {
      versionFindUnique.mockResolvedValue(null);

      await expect(service.getVersion('cxv_missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── createVersion ─────────────────────────────────────────────────────────

  describe('createVersion', () => {
    it('creates a DRAFT version with version number incremented from latest', async () => {
      // getNextVersionNumber: findFirst returns version 2
      versionFindFirst
        .mockResolvedValueOnce({ version: 2 }) // latest version number
        .mockResolvedValueOnce(null); // no published version to clone from

      const created = makeVersion({ version: 3, _count: { screens: 0 } });
      versionCreate.mockResolvedValue(created);

      const result = await service.createVersion('app_1', 'org_1', 'user_1', {
        description: 'v3',
        cloneFromLatest: false,
      });

      expect(versionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appId: 'app_1',
            orgId: 'org_1',
            version: 3,
            status: CODEX_VERSION_STATUS.DRAFT,
            createdById: 'user_1',
          }),
        }),
      );
      expect(result.id).toBe(created.id);
    });

    it('starts at version 1 when no previous versions exist', async () => {
      versionFindFirst
        .mockResolvedValueOnce(null) // no previous version
        .mockResolvedValueOnce(null); // no published to clone

      const created = makeVersion({ version: 1 });
      versionCreate.mockResolvedValue(created);

      await service.createVersion('app_1', 'org_1', 'user_1', {
        description: 'first',
        cloneFromLatest: false,
      });

      expect(versionCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ version: 1 }) }),
      );
    });

    it('clones from published version when cloneFromLatest is true', async () => {
      versionFindFirst
        .mockResolvedValueOnce({ version: 1 }) // latest version number
        .mockResolvedValueOnce({ id: 'cxv_pub' }); // published version found

      const created = makeVersion({ id: 'cxv_2', version: 2 });
      versionCreate.mockResolvedValue(created);

      // cloneVersion internals
      screenFindMany.mockResolvedValue([
        {
          id: 'scr_1',
          slug: 'home',
          name: 'Home',
          description: null,
          screenType: null,
          sortOrder: 0,
          versionId: 'cxv_pub',
          contents: [{ screenId: 'scr_1', locale: 'en', contentTree: { title: 'Hi' } }],
          regions: [],
        },
      ]);
      screenCreate.mockResolvedValue({ id: 'scr_new' });
      contentCreateMany.mockResolvedValue({ count: 1 });

      await service.createVersion('app_1', 'org_1', 'user_1', {
        description: 'v2',
        cloneFromLatest: true,
      });

      expect(screenFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { versionId: 'cxv_pub' } }),
      );
      expect(contentCreateMany).toHaveBeenCalled();
    });

    it('skips cloning when cloneFromLatest is false', async () => {
      versionFindFirst.mockResolvedValueOnce(null); // no previous version
      versionCreate.mockResolvedValue(makeVersion());

      await service.createVersion('app_1', 'org_1', 'user_1', {
        description: 'v1',
        cloneFromLatest: false,
      });

      expect(screenFindMany).not.toHaveBeenCalled();
    });
  });

  // ── updateVersion ─────────────────────────────────────────────────────────

  describe('updateVersion', () => {
    it('updates description on DRAFT version', async () => {
      // findVersionOrThrow uses findUnique (no include)
      versionFindUnique.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.DRAFT }));
      const updated = makeVersion({ description: 'updated desc' });
      versionUpdate.mockResolvedValue(updated);

      const result = await service.updateVersion('cxv_1', { description: 'updated desc' });

      expect(versionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { description: 'updated desc' } }),
      );
      expect(result.description).toBe('updated desc');
    });

    it('throws ForbiddenException when version is not DRAFT', async () => {
      versionFindUnique.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.REVIEW }));

      await expect(service.updateVersion('cxv_1', { description: 'x' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when version does not exist', async () => {
      versionFindUnique.mockResolvedValue(null);

      await expect(service.updateVersion('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── deleteVersion ─────────────────────────────────────────────────────────

  describe('deleteVersion', () => {
    it('deletes a DRAFT version', async () => {
      versionFindUnique.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.DRAFT }));
      versionDelete.mockResolvedValue(undefined);

      await service.deleteVersion('cxv_1');

      expect(versionDelete).toHaveBeenCalledWith({ where: { id: 'cxv_1' } });
    });

    it('throws ForbiddenException when version is not DRAFT', async () => {
      versionFindUnique.mockResolvedValue(
        makeVersion({ status: CODEX_VERSION_STATUS.PUBLISHED }),
      );

      await expect(service.deleteVersion('cxv_1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when version does not exist', async () => {
      versionFindUnique.mockResolvedValue(null);

      await expect(service.deleteVersion('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── submitForReview ───────────────────────────────────────────────────────

  describe('submitForReview', () => {
    it('transitions DRAFT → REVIEW', async () => {
      versionFindUnique.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.DRAFT }));
      const updated = makeVersion({ status: CODEX_VERSION_STATUS.REVIEW });
      versionUpdate.mockResolvedValue(updated);

      const result = await service.submitForReview('cxv_1', 'user_1', { notes: undefined });

      expect(versionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: CODEX_VERSION_STATUS.REVIEW }),
        }),
      );
      expect(result.status).toBe(CODEX_VERSION_STATUS.REVIEW);
    });

    it('appends review notes to description when provided', async () => {
      versionFindUnique.mockResolvedValue(
        makeVersion({ status: CODEX_VERSION_STATUS.DRAFT, description: 'base' }),
      );
      versionUpdate.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.REVIEW }));

      await service.submitForReview('cxv_1', 'user_1', { notes: 'please review carefully' });

      expect(versionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'base\n\nReview notes: please review carefully',
          }),
        }),
      );
    });

    it('throws ForbiddenException when status is not DRAFT', async () => {
      versionFindUnique.mockResolvedValue(
        makeVersion({ status: CODEX_VERSION_STATUS.REVIEW }),
      );

      await expect(service.submitForReview('cxv_1', 'user_1', {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when version not found', async () => {
      versionFindUnique.mockResolvedValue(null);

      await expect(service.submitForReview('missing', 'user_1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── approveVersion ────────────────────────────────────────────────────────

  describe('approveVersion', () => {
    it('transitions REVIEW → PUBLISHED and archives current published', async () => {
      versionFindUnique.mockResolvedValue(
        makeVersion({ status: CODEX_VERSION_STATUS.REVIEW, appId: 'app_1' }),
      );
      const published = makeVersion({ status: CODEX_VERSION_STATUS.PUBLISHED });
      versionUpdate.mockResolvedValue(published);
      versionUpdateMany.mockResolvedValue({ count: 1 });

      const result = await service.approveVersion('cxv_1', 'user_reviewer');

      expect(versionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: CODEX_VERSION_STATUS.PUBLISHED,
            reviewedById: 'user_reviewer',
          }),
        }),
      );
      expect(versionUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: CODEX_VERSION_STATUS.ARCHIVED },
        }),
      );
      expect(result.status).toBe(CODEX_VERSION_STATUS.PUBLISHED);
    });

    it('throws ForbiddenException when version is not in REVIEW', async () => {
      versionFindUnique.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.DRAFT }));

      await expect(service.approveVersion('cxv_1', 'reviewer')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── rejectVersion ─────────────────────────────────────────────────────────

  describe('rejectVersion', () => {
    it('transitions REVIEW → DRAFT and appends feedback', async () => {
      versionFindUnique.mockResolvedValue(
        makeVersion({ status: CODEX_VERSION_STATUS.REVIEW, description: 'v1' }),
      );
      const rejectedVersion = makeVersion({ status: CODEX_VERSION_STATUS.DRAFT });
      versionUpdate.mockResolvedValue(rejectedVersion);

      const result = await service.rejectVersion('cxv_1', 'reviewer', {
        decision: 'reject',
        feedback: 'needs more work',
      });

      expect(versionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: CODEX_VERSION_STATUS.DRAFT,
            description: 'v1\n\nRejection feedback: needs more work',
          }),
        }),
      );
      expect(result.status).toBe(CODEX_VERSION_STATUS.DRAFT);
    });

    it('throws BadRequestException when feedback is missing', async () => {
      versionFindUnique.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.REVIEW }));

      await expect(
        service.rejectVersion('cxv_1', 'reviewer', { decision: 'reject', feedback: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when status is not REVIEW', async () => {
      versionFindUnique.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.DRAFT }));

      await expect(
        service.rejectVersion('cxv_1', 'reviewer', { decision: 'reject', feedback: 'reason' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── publishVersion ────────────────────────────────────────────────────────

  describe('publishVersion', () => {
    it('transitions REVIEW → PUBLISHED directly', async () => {
      versionFindUnique.mockResolvedValue(
        makeVersion({ status: CODEX_VERSION_STATUS.REVIEW, appId: 'app_1' }),
      );
      versionUpdate.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.PUBLISHED }));
      versionUpdateMany.mockResolvedValue({ count: 0 });

      const result = await service.publishVersion('cxv_1');

      expect(versionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: CODEX_VERSION_STATUS.PUBLISHED }),
        }),
      );
      expect(result.status).toBe(CODEX_VERSION_STATUS.PUBLISHED);
    });

    it('throws ForbiddenException when not in REVIEW status', async () => {
      versionFindUnique.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.DRAFT }));

      await expect(service.publishVersion('cxv_1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── rollbackToVersion ─────────────────────────────────────────────────────

  describe('rollbackToVersion', () => {
    it('transitions ARCHIVED → PUBLISHED (rollback)', async () => {
      versionFindUnique.mockResolvedValue(
        makeVersion({ status: CODEX_VERSION_STATUS.ARCHIVED, appId: 'app_1' }),
      );
      versionUpdateMany.mockResolvedValue({ count: 1 });
      versionUpdate.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.PUBLISHED }));

      const result = await service.rollbackToVersion('cxv_1');

      expect(versionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: CODEX_VERSION_STATUS.PUBLISHED }),
        }),
      );
      expect(result.status).toBe(CODEX_VERSION_STATUS.PUBLISHED);
    });

    it('archives current published version before rolling back', async () => {
      versionFindUnique.mockResolvedValue(
        makeVersion({ id: 'cxv_old', status: CODEX_VERSION_STATUS.ARCHIVED, appId: 'app_1' }),
      );
      versionUpdateMany.mockResolvedValue({ count: 1 });
      versionUpdate.mockResolvedValue(makeVersion({ status: CODEX_VERSION_STATUS.PUBLISHED }));

      await service.rollbackToVersion('cxv_old');

      expect(versionUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            appId: 'app_1',
            status: CODEX_VERSION_STATUS.PUBLISHED,
            id: { not: 'cxv_old' },
          }),
        }),
      );
    });

    it('throws ForbiddenException when version is not ARCHIVED', async () => {
      versionFindUnique.mockResolvedValue(
        makeVersion({ status: CODEX_VERSION_STATUS.PUBLISHED }),
      );

      await expect(service.rollbackToVersion('cxv_1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when version not found', async () => {
      versionFindUnique.mockResolvedValue(null);

      await expect(service.rollbackToVersion('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── cloneVersion (via createVersion with cloneFromLatest) ─────────────────

  describe('createVersion (clone with regions)', () => {
    it('clones screens with contents AND regions', async () => {
      versionFindFirst
        .mockResolvedValueOnce({ version: 1 })
        .mockResolvedValueOnce({ id: 'cxv_pub' });

      versionCreate.mockResolvedValue(makeVersion({ id: 'cxv_2', version: 2 }));

      screenFindMany.mockResolvedValue([
        {
          id: 'scr_1',
          slug: 'home',
          name: 'Home',
          description: null,
          screenType: null,
          sortOrder: 0,
          versionId: 'cxv_pub',
          contents: [],
          regions: [
            {
              id: 'rgn_1',
              screenId: 'scr_1',
              contentKey: 'title',
              extractedText: 'Hello',
              confidence: 0.95,
              semanticRole: 'heading',
              boundingBox: { x: 0, y: 0, width: 100, height: 30 },
              isConfirmed: true,
              isIgnored: false,
              userKey: null,
            },
          ],
        },
      ]);
      screenCreate.mockResolvedValue({ id: 'scr_new' });
      regionCreateMany.mockResolvedValue({ count: 1 });

      await service.createVersion('app_1', 'org_1', 'user_1', {
        description: 'cloned',
        cloneFromLatest: true,
      });

      expect(regionCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              screenId: 'scr_new',
              contentKey: 'title',
            }),
          ]),
        }),
      );
    });
  });
});
