import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/prisma';
import { Prisma } from '@prisma/client';
import type { HeimdalJwtClaims } from '@heimdal/shared';
import { CodexVersionService } from './codex-version.service';
import { CodexScreenService } from './codex-screen.service';
import { CodexContentService } from './codex-content.service';
import { CodexLocaleService } from './codex-locale.service';
import { CodexStorageService } from './services/codex-storage.service';
import { CodexAiService } from './services/codex-ai.service';
import { CodexTranslationService } from './codex-translation.service';
import {
  CreateCodexVersionDto,
  UpdateCodexVersionDto,
  SubmitForReviewDto,
  ReviewDecisionDto,
  CreateCodexScreenDto,
  UpdateCodexScreenDto,
  UpdateCodexContentDto,
  CreateCodexLocaleDto,
  TranslateVersionDto,
} from './dto';

@ApiTags('codex')
@Controller()
export class CodexController {
  constructor(
    private readonly versionService: CodexVersionService,
    private readonly screenService: CodexScreenService,
    private readonly contentService: CodexContentService,
    private readonly localeService: CodexLocaleService,
    private readonly storageService: CodexStorageService,
    private readonly aiService: CodexAiService,
    private readonly translationService: CodexTranslationService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Version routes ─────────────────────────────────────────────────

  @Post('admin/apps/:appId/codex/versions')
  async createVersion(
    @Param('appId') appId: string,
    @Body() dto: CreateCodexVersionDto,
    @CurrentUser() user: HeimdalJwtClaims,
  ) {
    // Ensure a base locale exists before creating a version
    await this.localeService.ensureBaseLocale(appId);
    return this.versionService.createVersion(appId, user.org, user.sub, dto);
  }

  @Get('admin/apps/:appId/codex/versions')
  listVersions(@Param('appId') appId: string) {
    return this.versionService.listVersions(appId);
  }

  @Get('admin/codex/versions/:versionId')
  getVersion(@Param('versionId') versionId: string) {
    return this.versionService.getVersion(versionId);
  }

  @Patch('admin/codex/versions/:versionId')
  updateVersion(@Param('versionId') versionId: string, @Body() dto: UpdateCodexVersionDto) {
    return this.versionService.updateVersion(versionId, dto);
  }

  @Delete('admin/codex/versions/:versionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteVersion(@Param('versionId') versionId: string) {
    return this.versionService.deleteVersion(versionId);
  }

  @Post('admin/codex/versions/:versionId/submit')
  submitForReview(
    @Param('versionId') versionId: string,
    @Body() dto: SubmitForReviewDto,
    @CurrentUser() user: HeimdalJwtClaims,
  ) {
    return this.versionService.submitForReview(versionId, user.sub, dto);
  }

  @Post('admin/codex/versions/:versionId/approve')
  approveVersion(
    @Param('versionId') versionId: string,
    @CurrentUser() user: HeimdalJwtClaims,
  ) {
    return this.versionService.approveVersion(versionId, user.sub);
  }

  @Post('admin/codex/versions/:versionId/reject')
  rejectVersion(
    @Param('versionId') versionId: string,
    @Body() dto: ReviewDecisionDto,
    @CurrentUser() user: HeimdalJwtClaims,
  ) {
    return this.versionService.rejectVersion(versionId, user.sub, dto);
  }

  @Post('admin/codex/versions/:versionId/rollback')
  rollbackToVersion(@Param('versionId') versionId: string) {
    return this.versionService.rollbackToVersion(versionId);
  }

  @Post('admin/codex/versions/:versionId/translate')
  translateVersion(
    @Param('versionId') versionId: string,
    @Body() dto: TranslateVersionDto,
  ) {
    return this.translationService.translateVersion(
      versionId,
      dto.targetLocale,
      dto.sourceLocale,
    );
  }

  // ── Screen routes ──────────────────────────────────────────────────

  @Post('admin/codex/versions/:versionId/screens')
  createScreen(@Param('versionId') versionId: string, @Body() dto: CreateCodexScreenDto) {
    return this.screenService.createScreen(versionId, dto);
  }

  @Get('admin/codex/versions/:versionId/screens')
  listScreens(@Param('versionId') versionId: string) {
    return this.screenService.listScreens(versionId);
  }

  @Get('admin/codex/screens/:screenId')
  getScreen(@Param('screenId') screenId: string) {
    return this.screenService.getScreen(screenId);
  }

  @Patch('admin/codex/screens/:screenId')
  updateScreen(@Param('screenId') screenId: string, @Body() dto: UpdateCodexScreenDto) {
    return this.screenService.updateScreen(screenId, dto);
  }

  @Delete('admin/codex/screens/:screenId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteScreen(@Param('screenId') screenId: string) {
    return this.screenService.deleteScreen(screenId);
  }

  @Patch('admin/codex/versions/:versionId/screens/reorder')
  reorderScreens(
    @Param('versionId') versionId: string,
    @Body('screenIds') screenIds: string[],
  ) {
    return this.screenService.reorderScreens(versionId, screenIds);
  }

  // ── Content routes ─────────────────────────────────────────────────

  @Get('admin/codex/screens/:screenId/content')
  getContent(
    @Param('screenId') screenId: string,
    @Query('locale') locale: string,
  ) {
    return this.contentService.getContent(screenId, locale);
  }

  @Put('admin/codex/screens/:screenId/content')
  updateContent(@Param('screenId') screenId: string, @Body() dto: UpdateCodexContentDto) {
    return this.contentService.updateContent(screenId, dto);
  }

  @Patch('admin/codex/screens/:screenId/content')
  patchContent(
    @Param('screenId') screenId: string,
    @Body() body: { locale: string } & Record<string, unknown>,
  ) {
    const { locale, ...patch } = body;
    return this.contentService.patchContent(screenId, locale, patch);
  }

  // ── Locale routes ──────────────────────────────────────────────────

  @Post('admin/apps/:appId/codex/locales')
  createLocale(@Param('appId') appId: string, @Body() dto: CreateCodexLocaleDto) {
    return this.localeService.createLocale(appId, dto);
  }

  @Get('admin/apps/:appId/codex/locales')
  listLocales(@Param('appId') appId: string) {
    return this.localeService.listLocales(appId);
  }

  @Delete('admin/codex/locales/:localeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLocale(@Param('localeId') localeId: string) {
    return this.localeService.deleteLocale(localeId);
  }

  // ── Image upload + AI analysis ─────────────────────────────────────────────

  @Post('admin/codex/screens/:screenId/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async uploadScreenImage(
    @Param('screenId') screenId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);

    // Delete previous image files for this screen
    await this.storageService.deleteScreenFiles(screenId);

    const result = await this.storageService.uploadScreenshot(
      screenId,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    // Save to DB
    const image = await this.prisma.codexScreenImage.upsert({
      where: { screenId },
      create: {
        screenId,
        originalUrl: result.originalUrl,
        thumbnailUrl: result.thumbnailUrl,
        sizeBytes: result.sizeBytes,
        mimeType: result.mimeType,
      },
      update: {
        originalUrl: result.originalUrl,
        thumbnailUrl: result.thumbnailUrl,
        sizeBytes: result.sizeBytes,
        mimeType: result.mimeType,
        aiAnalysisId: null,
      },
    });

    return image;
  }

  @Post('admin/codex/screens/:screenId/analyze')
  async analyzeScreen(@Param('screenId') screenId: string) {
    // Get the uploaded image for this screen
    const image = await this.prisma.codexScreenImage.findUnique({ where: { screenId } });
    if (!image) {
      throw new HttpException(
        'No image uploaded for this screen. Upload a screenshot first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Read the file as base64
    const filePath = join(process.cwd(), image.originalUrl);
    let imageBase64: string;
    try {
      const buffer = await readFile(filePath);
      imageBase64 = buffer.toString('base64');
    } catch {
      throw new HttpException(
        'Image file not found. Please re-upload.',
        HttpStatus.NOT_FOUND,
      );
    }

    // Get screen info
    const screen = await this.prisma.codexScreen.findUnique({ where: { id: screenId } });
    if (!screen) throw new HttpException('Screen not found', HttpStatus.NOT_FOUND);

    // Run AI analysis
    const analysis = await this.aiService.analyzeScreen(
      imageBase64,
      screen.slug,
      image.mimeType ?? 'image/png',
    );

    // Persist regions
    await this.prisma.codexRegion.deleteMany({ where: { screenId } });

    if (analysis.regions.length > 0) {
      // Deduplicate by suggestedKey — AI may occasionally return duplicate keys
      const seen = new Set<string>();
      const uniqueRegions = analysis.regions.filter((r) => {
        if (seen.has(r.suggestedKey)) return false;
        seen.add(r.suggestedKey);
        return true;
      });

      await this.prisma.codexRegion.createMany({
        data: uniqueRegions.map((r) => ({
          screenId,
          contentKey: r.suggestedKey,
          extractedText: r.extractedText,
          confidence: r.confidence,
          semanticRole: r.semanticRole,
          boundingBox: r.boundingBox as unknown as Prisma.InputJsonValue,
          isConfirmed: false,
          isIgnored: false,
        })),
      });
    }

    // Update screen type from AI
    if (analysis.screenType) {
      await this.prisma.codexScreen.update({
        where: { id: screenId },
        data: { screenType: analysis.screenType },
      });
    }

    // Persist the generated content tree for the base locale
    if (analysis.contentTree && Object.keys(analysis.contentTree).length > 0) {
      const screenWithVersion = await this.prisma.codexScreen.findUnique({
        where: { id: screenId },
        include: { version: true },
      });

      const baseLocale = await this.prisma.codexLocale.findFirst({
        where: { appId: screenWithVersion?.version.appId, isBase: true },
      });

      const locale = baseLocale?.locale ?? 'en';

      await this.prisma.codexContent.upsert({
        where: {
          screenId_locale: { screenId, locale },
        },
        create: {
          screenId,
          locale,
          contentTree: analysis.contentTree as Prisma.InputJsonValue,
        },
        update: {
          contentTree: analysis.contentTree as Prisma.InputJsonValue,
        },
      });
    }

    return {
      screenType: analysis.screenType,
      confidence: analysis.confidence,
      regionCount: analysis.regions.length,
      regions: analysis.regions,
      sections: analysis.sections,
      contentTree: analysis.contentTree,
    };
  }
}
