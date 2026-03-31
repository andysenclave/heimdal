import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma';
import { CODEX_VERSION_STATUS, CONTENT_TREE_RULES } from '@heimdal/shared';
import type { UpdateCodexContentDto } from './dto/update-content.dto';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class CodexContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getContent(screenId: string, locale: string) {
    const content = await this.prisma.codexContent.findUnique({
      where: { screenId_locale: { screenId, locale } },
    });
    if (!content) {
      throw new NotFoundException(`No content found for screen ${screenId} in locale "${locale}"`);
    }
    return content;
  }

  async updateContent(screenId: string, dto: UpdateCodexContentDto) {
    await this.assertDraftScreen(screenId);

    const validation = this.validateContentTree(dto.contentTree);
    if (!validation.valid) {
      throw new BadRequestException(`Invalid content tree: ${validation.errors.join('; ')}`);
    }

    return this.prisma.codexContent.upsert({
      where: { screenId_locale: { screenId, locale: dto.locale } },
      create: {
        screenId,
        locale: dto.locale,
        contentTree: dto.contentTree as Prisma.InputJsonValue,
      },
      update: {
        contentTree: dto.contentTree as Prisma.InputJsonValue,
      },
    });
  }

  async patchContent(screenId: string, locale: string, patch: Record<string, unknown>) {
    await this.assertDraftScreen(screenId);

    const existing = await this.prisma.codexContent.findUnique({
      where: { screenId_locale: { screenId, locale } },
    });

    const mergedTree = existing
      ? this.deepMerge(existing.contentTree as Record<string, unknown>, patch)
      : patch;

    const validation = this.validateContentTree(mergedTree);
    if (!validation.valid) {
      throw new BadRequestException(`Invalid content tree: ${validation.errors.join('; ')}`);
    }

    return this.prisma.codexContent.upsert({
      where: { screenId_locale: { screenId, locale } },
      create: { screenId, locale, contentTree: mergedTree as Prisma.InputJsonValue },
      update: { contentTree: mergedTree as Prisma.InputJsonValue },
    });
  }

  async deleteContent(screenId: string, locale: string): Promise<void> {
    await this.assertDraftScreen(screenId);
    const existing = await this.prisma.codexContent.findUnique({
      where: { screenId_locale: { screenId, locale } },
    });
    if (!existing) {
      throw new NotFoundException(`No content for screen ${screenId} in locale "${locale}"`);
    }
    await this.prisma.codexContent.delete({
      where: { screenId_locale: { screenId, locale } },
    });
  }

  async getMergedContent(
    versionId: string,
    locale: string,
    screenSlugs?: string[],
  ): Promise<Record<string, unknown>> {
    const screens = await this.prisma.codexScreen.findMany({
      where: {
        versionId,
        ...(screenSlugs && screenSlugs.length > 0 ? { slug: { in: screenSlugs } } : {}),
      },
      include: {
        contents: {
          where: { locale },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const merged: Record<string, unknown> = {};
    for (const screen of screens) {
      const content = screen.contents[0];
      if (content) {
        const tree = content.contentTree as Record<string, unknown>;
        // Strip _meta from public output
        const { _meta: _stripped, ...rest } = tree as { _meta?: unknown; [k: string]: unknown };
        merged[screen.slug] = rest;
      }
    }
    return merged;
  }

  // ── Private validation ────────────────────────────────────────────────────

  private validateContentTree(tree: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    const invalidKeys = this.enforceKeyPattern(tree, 0);
    if (invalidKeys.length > 0) {
      errors.push(`Invalid key names: ${invalidKeys.slice(0, 5).join(', ')}`);
    }

    if (!this.enforceMaxDepth(tree, 0)) {
      errors.push(`Content tree exceeds maximum depth of ${CONTENT_TREE_RULES.maxDepth}`);
    }

    const leafCount = this.countLeafKeys(tree);
    if (leafCount > CONTENT_TREE_RULES.maxKeysPerScreen) {
      errors.push(`Too many keys: ${leafCount} > ${CONTENT_TREE_RULES.maxKeysPerScreen}`);
    }

    const longValues = this.findLongValues(tree);
    if (longValues.length > 0) {
      errors.push(
        `Values too long (max ${CONTENT_TREE_RULES.maxValueLength} chars): ${longValues.join(', ')}`,
      );
    }

    return { valid: errors.length === 0, errors };
  }

  private enforceMaxDepth(tree: Record<string, unknown>, currentDepth: number): boolean {
    if (currentDepth >= CONTENT_TREE_RULES.maxDepth) return false;
    for (const value of Object.values(tree)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        if (!this.enforceMaxDepth(value as Record<string, unknown>, currentDepth + 1)) {
          return false;
        }
      }
    }
    return true;
  }

  private enforceKeyPattern(tree: Record<string, unknown>, depth: number): string[] {
    const invalid: string[] = [];
    for (const [key, value] of Object.entries(tree)) {
      if (key === '_meta') continue; // reserved, skip
      if (!CONTENT_TREE_RULES.keyPattern.test(key)) {
        invalid.push(key);
      }
      if (CONTENT_TREE_RULES.reservedKeys.includes(key) && key !== '_meta') {
        invalid.push(key);
      }
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        depth < CONTENT_TREE_RULES.maxDepth
      ) {
        invalid.push(...this.enforceKeyPattern(value as Record<string, unknown>, depth + 1));
      }
    }
    return invalid;
  }

  private countLeafKeys(tree: Record<string, unknown>): number {
    let count = 0;
    for (const value of Object.values(tree)) {
      if (typeof value === 'string') {
        count++;
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        count += this.countLeafKeys(value as Record<string, unknown>);
      }
    }
    return count;
  }

  private findLongValues(tree: Record<string, unknown>): string[] {
    const long: string[] = [];
    for (const [key, value] of Object.entries(tree)) {
      if (typeof value === 'string' && value.length > CONTENT_TREE_RULES.maxValueLength) {
        long.push(key);
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        long.push(...this.findLongValues(value as Record<string, unknown>));
      }
    }
    return long;
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        result[key] = this.deepMerge(
          target[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        );
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private async assertDraftScreen(screenId: string): Promise<void> {
    const screen = await this.prisma.codexScreen.findUnique({
      where: { id: screenId },
      include: { version: { select: { status: true } } },
    });
    if (!screen) throw new NotFoundException(`Screen ${screenId} not found`);
    if (screen.version.status !== CODEX_VERSION_STATUS.DRAFT) {
      throw new ForbiddenException('Content can only be edited on screens in DRAFT versions');
    }
  }
}
