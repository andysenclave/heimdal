import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../common/prisma';
import { CodexContentService } from './codex-content.service';
import { CODEX_VERSION_STATUS } from '@heimdal/shared';

interface CodexMeta {
  appId: string;
  orgId: string;
  version: number;
  locale: string;
  publishedAt: string;
  screenCount: number;
  generatedAt: string;
}

interface CodexPublishedResponse {
  _codex: CodexMeta;
  [screenSlug: string]: Record<string, unknown> | CodexMeta;
}

@ApiTags('codex-public')
@Controller('codex')
export class CodexPublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentService: CodexContentService,
  ) {}

  @Public()
  @Get('apps/:appId/content')
  @ApiHeader({ name: 'x-app-id', description: 'Application public identifier', required: true })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale code (defaults to base locale)' })
  @ApiQuery({
    name: 'version',
    required: false,
    description: '"latest" or a specific version number',
  })
  @ApiQuery({
    name: 'screen',
    required: false,
    description: 'Comma-separated screen slugs to filter',
  })
  async getPublishedContent(
    @Param('appId') appId: string,
    @Headers('x-app-id') _headerAppId: string,
    @Query('locale') locale?: string,
    @Query('version') versionParam?: string,
    @Query('screen') screenParam?: string,
  ): Promise<CodexPublishedResponse> {
    // Find the application
    const app = await this.prisma.application.findFirst({
      where: { appId },
    });
    if (!app) throw new NotFoundException(`Application "${appId}" not found`);

    // Resolve which version to serve
    let codexVersion;
    if (versionParam && versionParam !== 'latest') {
      const versionNum = parseInt(versionParam, 10);
      codexVersion = await this.prisma.codexVersion.findFirst({
        where: {
          appId: app.id,
          version: versionNum,
          status: CODEX_VERSION_STATUS.PUBLISHED,
        },
      });
    } else {
      codexVersion = await this.prisma.codexVersion.findFirst({
        where: {
          appId: app.id,
          status: CODEX_VERSION_STATUS.PUBLISHED,
        },
        orderBy: { version: 'desc' },
      });
    }

    if (!codexVersion) {
      throw new NotFoundException(`No published version found for application "${appId}"`);
    }

    // Resolve locale — default to base locale
    let resolvedLocale = locale;
    if (!resolvedLocale) {
      const baseLocale = await this.prisma.codexLocale.findFirst({
        where: { appId: app.id, isBase: true },
      });
      resolvedLocale = baseLocale?.locale ?? 'en';
    } else {
      // Verify requested locale is configured
      const configuredLocale = await this.prisma.codexLocale.findUnique({
        where: { appId_locale: { appId: app.id, locale: resolvedLocale } },
      });
      if (!configuredLocale) {
        throw new NotFoundException(
          `Locale "${resolvedLocale}" is not configured for this application`,
        );
      }
    }

    // Parse screen filter
    const screenSlugs = screenParam
      ? screenParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    // Get merged content
    const mergedContent = await this.contentService.getMergedContent(
      codexVersion.id,
      resolvedLocale,
      screenSlugs,
    );

    const screenCount = Object.keys(mergedContent).length;

    const meta: CodexMeta = {
      appId,
      orgId: codexVersion.orgId,
      version: codexVersion.version,
      locale: resolvedLocale,
      publishedAt: codexVersion.publishedAt?.toISOString() ?? new Date().toISOString(),
      screenCount,
      generatedAt: new Date().toISOString(),
    };

    return {
      _codex: meta,
      ...(mergedContent as Record<string, Record<string, unknown>>),
    } as CodexPublishedResponse;
  }
}
