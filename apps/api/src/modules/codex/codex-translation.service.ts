import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma';
import { CodexAiService } from './services/codex-ai.service';

export interface TranslationResult {
  translated: number;
  failed: number;
  locale: string;
}

@Injectable()
export class CodexTranslationService {
  private readonly logger = new Logger(CodexTranslationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: CodexAiService,
  ) {}

  async translateVersion(
    versionId: string,
    targetLocale: string,
    sourceLocale: string = 'en',
  ): Promise<TranslationResult> {
    // Verify version exists
    const version = await this.prisma.codexVersion.findUnique({
      where: { id: versionId },
      select: { id: true },
    });
    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Fetch all screens for this version, including source locale content
    const screens = await this.prisma.codexScreen.findMany({
      where: { versionId },
      include: {
        contents: {
          where: { locale: sourceLocale },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    let translated = 0;
    let failed = 0;

    for (const screen of screens) {
      const sourceContent = screen.contents[0];
      if (!sourceContent) {
        // No source content for this screen — skip silently
        continue;
      }

      const contentTree = sourceContent.contentTree as Record<string, unknown>;

      try {
        const translatedTree = await this.aiService.translateContent(
          contentTree,
          sourceLocale,
          targetLocale,
          { screenType: screen.screenType ?? undefined },
        );

        await this.prisma.codexContent.upsert({
          where: { screenId_locale: { screenId: screen.id, locale: targetLocale } },
          create: {
            screenId: screen.id,
            locale: targetLocale,
            contentTree: translatedTree as Prisma.InputJsonValue,
          },
          update: {
            contentTree: translatedTree as Prisma.InputJsonValue,
          },
        });

        translated++;
      } catch (err) {
        this.logger.warn(
          `Translation failed for screen ${screen.id} (${screen.slug}) — locale ${sourceLocale} → ${targetLocale}`,
          err,
        );
        failed++;
      }
    }

    return { translated, failed, locale: targetLocale };
  }
}
