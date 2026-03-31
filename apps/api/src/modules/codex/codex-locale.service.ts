// NOTE: This file requires `npx prisma generate` to have been run from packages/prisma-client/
// before the TypeScript compiler can resolve `this.prisma.codexLocale`. If you see
// "Property 'codexLocale' does not exist" errors, run:
//   cd packages/prisma-client && npx prisma generate

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import type { CreateCodexLocaleDto } from './dto/create-locale.dto';

@Injectable()
export class CodexLocaleService {
  constructor(private readonly prisma: PrismaService) {}

  async createLocale(appId: string, dto: CreateCodexLocaleDto) {
    // Check app exists
    const app = await this.prisma.application.findUnique({ where: { id: appId } });
    if (!app) throw new NotFoundException(`Application ${appId} not found`);

    // Check for duplicate
    const existing = await this.prisma.codexLocale.findUnique({
      where: { appId_locale: { appId, locale: dto.locale } },
    });
    if (existing)
      throw new ConflictException(`Locale "${dto.locale}" already configured for this app`);

    // If setting as base, demote any existing base locale first
    if (dto.isBase) {
      await this.prisma.codexLocale.updateMany({
        where: { appId, isBase: true },
        data: { isBase: false },
      });
    }

    // Auto-make base if this is the first locale
    const count = await this.prisma.codexLocale.count({ where: { appId } });
    const isBase = dto.isBase ?? count === 0;

    return this.prisma.codexLocale.create({
      data: {
        appId,
        locale: dto.locale,
        name: dto.name,
        isBase,
        isActive: true,
      },
    });
  }

  async listLocales(appId: string) {
    return this.prisma.codexLocale.findMany({
      where: { appId },
      orderBy: [{ isBase: 'desc' }, { locale: 'asc' }],
    });
  }

  async updateLocale(localeId: string, data: { name?: string; isActive?: boolean }) {
    const locale = await this.prisma.codexLocale.findUnique({ where: { id: localeId } });
    if (!locale) throw new NotFoundException(`Locale ${localeId} not found`);

    return this.prisma.codexLocale.update({
      where: { id: localeId },
      data,
    });
  }

  async deleteLocale(localeId: string): Promise<void> {
    const locale = await this.prisma.codexLocale.findUnique({ where: { id: localeId } });
    if (!locale) throw new NotFoundException(`Locale ${localeId} not found`);
    if (locale.isBase) {
      throw new ForbiddenException(
        'Cannot delete the base locale. Set another locale as base first.',
      );
    }
    await this.prisma.codexLocale.delete({ where: { id: localeId } });
  }

  async getBaseLocale(appId: string) {
    const base = await this.prisma.codexLocale.findFirst({
      where: { appId, isBase: true },
    });
    if (!base) throw new NotFoundException(`No base locale configured for app ${appId}`);
    return base;
  }

  async ensureBaseLocale(appId: string) {
    const existing = await this.prisma.codexLocale.findFirst({
      where: { appId, isBase: true },
    });
    if (existing) return existing;

    // Auto-create "en" as base locale
    return this.prisma.codexLocale.create({
      data: {
        appId,
        locale: 'en',
        name: 'English',
        isBase: true,
        isActive: true,
      },
    });
  }
}
