import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CODEX_VERSION_STATUS } from '@heimdal/shared';
import type { CodexVersion, CodexContent, CodexRegion, CodexVersionStatus } from '@prisma/client';
import type { CreateCodexVersionDto } from './dto/create-version.dto';
import type { UpdateCodexVersionDto } from './dto/update-version.dto';
import type { SubmitForReviewDto } from './dto/submit-review.dto';
import type { ReviewDecisionDto } from './dto/review-decision.dto';

// ── Return shape helpers ───────────────────────────────────────────────────────

function versionWithMeta(
  version: CodexVersion & {
    _count?: { screens: number };
    createdBy?: { id: string; name: string | null; email: string };
    reviewedBy?: { id: string; name: string | null; email: string } | null;
  },
) {
  return {
    ...version,
    screenCount: version._count?.screens ?? 0,
  };
}

type VersionWithMeta = ReturnType<typeof versionWithMeta>;

// ── Includes reused across all queries ────────────────────────────────────────

const VERSION_INCLUDE = {
  _count: { select: { screens: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class CodexVersionService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Read ───────────────────────────────────────────────────────────────────

  async listVersions(appId: string): Promise<VersionWithMeta[]> {
    const versions = await this.prisma.codexVersion.findMany({
      where: { appId },
      include: VERSION_INCLUDE,
      orderBy: { version: 'desc' },
    });
    return versions.map(versionWithMeta);
  }

  async getVersion(versionId: string): Promise<VersionWithMeta> {
    const version = await this.prisma.codexVersion.findUnique({
      where: { id: versionId },
      include: VERSION_INCLUDE,
    });
    if (!version) throw new NotFoundException(`Version ${versionId} not found`);
    return versionWithMeta(version);
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async createVersion(
    appId: string,
    orgId: string,
    userId: string,
    dto: CreateCodexVersionDto,
  ): Promise<VersionWithMeta> {
    const nextNumber = await this.getNextVersionNumber(appId);

    const version = await this.prisma.codexVersion.create({
      data: {
        appId,
        orgId,
        version: nextNumber,
        status: CODEX_VERSION_STATUS.DRAFT,
        description: dto.description,
        createdById: userId,
      },
      include: VERSION_INCLUDE,
    });

    // Clone screens + content from latest published version if requested
    if (dto.cloneFromLatest !== false) {
      const published = await this.prisma.codexVersion.findFirst({
        where: { appId, status: CODEX_VERSION_STATUS.PUBLISHED },
        orderBy: { version: 'desc' },
      });
      if (published) {
        await this.cloneVersion(published.id, version.id);
      }
    }

    return versionWithMeta(version);
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async updateVersion(versionId: string, dto: UpdateCodexVersionDto): Promise<VersionWithMeta> {
    const existing = await this.findVersionOrThrow(versionId);
    if (existing.status !== CODEX_VERSION_STATUS.DRAFT) {
      throw new ForbiddenException('Only DRAFT versions can be updated');
    }

    const updated = await this.prisma.codexVersion.update({
      where: { id: versionId },
      data: { description: dto.description },
      include: VERSION_INCLUDE,
    });
    return versionWithMeta(updated);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async deleteVersion(versionId: string): Promise<void> {
    const version = await this.findVersionOrThrow(versionId);
    if (version.status !== CODEX_VERSION_STATUS.DRAFT) {
      throw new ForbiddenException('Only DRAFT versions can be deleted');
    }
    await this.prisma.codexVersion.delete({ where: { id: versionId } });
  }

  // ── State machine ──────────────────────────────────────────────────────────

  async submitForReview(
    versionId: string,
    _userId: string,
    dto: SubmitForReviewDto,
  ): Promise<VersionWithMeta> {
    const version = await this.findVersionOrThrow(versionId);
    this.assertStatus(version, CODEX_VERSION_STATUS.DRAFT, 'submit for review');

    const updated = await this.prisma.codexVersion.update({
      where: { id: versionId },
      data: {
        status: CODEX_VERSION_STATUS.REVIEW,
        description: dto.notes
          ? `${version.description ?? ''}\n\nReview notes: ${dto.notes}`.trim()
          : version.description,
      },
      include: VERSION_INCLUDE,
    });
    return versionWithMeta(updated);
  }

  async approveVersion(versionId: string, reviewerId: string): Promise<VersionWithMeta> {
    const version = await this.findVersionOrThrow(versionId);
    this.assertStatus(version, CODEX_VERSION_STATUS.REVIEW, 'approve');

    const updated = await this.prisma.codexVersion.update({
      where: { id: versionId },
      data: {
        status: CODEX_VERSION_STATUS.PUBLISHED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        publishedAt: new Date(),
      },
      include: VERSION_INCLUDE,
    });

    await this.archiveCurrentPublished(version.appId, versionId);
    return versionWithMeta(updated);
  }

  async rejectVersion(
    versionId: string,
    reviewerId: string,
    dto: ReviewDecisionDto,
  ): Promise<VersionWithMeta> {
    const version = await this.findVersionOrThrow(versionId);
    this.assertStatus(version, CODEX_VERSION_STATUS.REVIEW, 'reject');

    if (!dto.feedback) {
      throw new BadRequestException('Feedback is required when rejecting a version');
    }

    const updated = await this.prisma.codexVersion.update({
      where: { id: versionId },
      data: {
        status: CODEX_VERSION_STATUS.DRAFT,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        description: `${version.description ?? ''}\n\nRejection feedback: ${dto.feedback}`.trim(),
      },
      include: VERSION_INCLUDE,
    });
    return versionWithMeta(updated);
  }

  async publishVersion(versionId: string): Promise<VersionWithMeta> {
    const version = await this.findVersionOrThrow(versionId);
    this.assertStatus(version, CODEX_VERSION_STATUS.REVIEW, 'publish directly');

    const updated = await this.prisma.codexVersion.update({
      where: { id: versionId },
      data: {
        status: CODEX_VERSION_STATUS.PUBLISHED,
        publishedAt: new Date(),
      },
      include: VERSION_INCLUDE,
    });

    await this.archiveCurrentPublished(version.appId, versionId);
    return versionWithMeta(updated);
  }

  async rollbackToVersion(versionId: string): Promise<VersionWithMeta> {
    const version = await this.findVersionOrThrow(versionId);
    this.assertStatus(version, CODEX_VERSION_STATUS.ARCHIVED, 'rollback');

    // Archive the current published version before reinstating this one
    await this.archiveCurrentPublished(version.appId, versionId);

    const updated = await this.prisma.codexVersion.update({
      where: { id: versionId },
      data: {
        status: CODEX_VERSION_STATUS.PUBLISHED,
        publishedAt: new Date(),
      },
      include: VERSION_INCLUDE,
    });
    return versionWithMeta(updated);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async findVersionOrThrow(versionId: string): Promise<CodexVersion> {
    const version = await this.prisma.codexVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException(`Version ${versionId} not found`);
    return version;
  }

  private assertStatus(
    version: CodexVersion,
    expected: CodexVersionStatus,
    operation: string,
  ): void {
    if (version.status !== expected) {
      throw new ForbiddenException(
        `Cannot ${operation}: version is ${version.status}, expected ${expected}`,
      );
    }
  }

  private async getNextVersionNumber(appId: string): Promise<number> {
    const latest = await this.prisma.codexVersion.findFirst({
      where: { appId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return (latest?.version ?? 0) + 1;
  }

  private async archiveCurrentPublished(appId: string, excludeVersionId: string): Promise<void> {
    await this.prisma.codexVersion.updateMany({
      where: {
        appId,
        status: CODEX_VERSION_STATUS.PUBLISHED,
        id: { not: excludeVersionId },
      },
      data: { status: CODEX_VERSION_STATUS.ARCHIVED },
    });
  }

  private async cloneVersion(sourceVersionId: string, targetVersionId: string): Promise<void> {
    const screens = await this.prisma.codexScreen.findMany({
      where: { versionId: sourceVersionId },
      include: {
        contents: true,
        regions: true,
      },
    });

    for (const screen of screens) {
      const newScreen = await this.prisma.codexScreen.create({
        data: {
          versionId: targetVersionId,
          slug: screen.slug,
          name: screen.name,
          description: screen.description,
          screenType: screen.screenType,
          sortOrder: screen.sortOrder,
        },
      });

      // Clone content trees
      if (screen.contents.length > 0) {
        await this.prisma.codexContent.createMany({
          data: screen.contents.map((c: CodexContent) => ({
            screenId: newScreen.id,
            locale: c.locale,
            contentTree: c.contentTree as object,
          })),
        });
      }

      // Clone regions (without image/AI data — those belong to the original screenshot)
      if (screen.regions.length > 0) {
        await this.prisma.codexRegion.createMany({
          data: screen.regions.map((r: CodexRegion) => ({
            screenId: newScreen.id,
            contentKey: r.contentKey,
            extractedText: r.extractedText,
            confidence: r.confidence,
            semanticRole: r.semanticRole,
            boundingBox: r.boundingBox as object | undefined,
            isConfirmed: r.isConfirmed,
            isIgnored: r.isIgnored,
            userKey: r.userKey,
          })),
        });
      }
    }
  }
}
