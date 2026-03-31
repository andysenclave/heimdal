import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CODEX_VERSION_STATUS } from '@heimdal/shared';
import type { CreateCodexScreenDto } from './dto/create-screen.dto';
import type { UpdateCodexScreenDto } from './dto/update-screen.dto';

@Injectable()
export class CodexScreenService {
  constructor(private readonly prisma: PrismaService) {}

  async createScreen(versionId: string, dto: CreateCodexScreenDto) {
    const version = await this.prisma.codexVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException(`Version ${versionId} not found`);
    if (version.status !== CODEX_VERSION_STATUS.DRAFT) {
      throw new ForbiddenException('Only DRAFT versions allow content changes');
    }

    const existing = await this.prisma.codexScreen.findUnique({
      where: { versionId_slug: { versionId, slug: dto.slug } },
    });
    if (existing) {
      throw new ConflictException(`Screen with slug "${dto.slug}" already exists in this version`);
    }

    const maxOrder = await this.prisma.codexScreen.aggregate({
      where: { versionId },
      _max: { sortOrder: true },
    });

    return this.prisma.codexScreen.create({
      data: {
        versionId,
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: {
        image: true,
        _count: { select: { regions: true } },
      },
    });
  }

  async listScreens(versionId: string) {
    const version = await this.prisma.codexVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException(`Version ${versionId} not found`);

    return this.prisma.codexScreen.findMany({
      where: { versionId },
      include: {
        image: { select: { id: true, thumbnailUrl: true, originalUrl: true } },
        _count: { select: { regions: true, contents: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getScreen(screenId: string) {
    const screen = await this.prisma.codexScreen.findUnique({
      where: { id: screenId },
      include: {
        image: true,
        _count: { select: { regions: true } },
        contents: { select: { locale: true } },
      },
    });
    if (!screen) throw new NotFoundException(`Screen ${screenId} not found`);
    return {
      ...screen,
      regionCount: screen._count.regions,
      locales: screen.contents.map((c) => c.locale),
    };
  }

  async updateScreen(screenId: string, dto: UpdateCodexScreenDto) {
    const screen = await this.prisma.codexScreen.findUnique({
      where: { id: screenId },
      include: { version: true },
    });
    if (!screen) throw new NotFoundException(`Screen ${screenId} not found`);
    if (screen.version.status !== CODEX_VERSION_STATUS.DRAFT) {
      throw new ForbiddenException('Only screens in DRAFT versions can be updated');
    }

    return this.prisma.codexScreen.update({
      where: { id: screenId },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: { image: true },
    });
  }

  async deleteScreen(screenId: string): Promise<void> {
    const screen = await this.prisma.codexScreen.findUnique({
      where: { id: screenId },
      include: { version: true },
    });
    if (!screen) throw new NotFoundException(`Screen ${screenId} not found`);
    if (screen.version.status !== CODEX_VERSION_STATUS.DRAFT) {
      throw new ForbiddenException('Only screens in DRAFT versions can be deleted');
    }

    await this.prisma.codexScreen.delete({ where: { id: screenId } });
  }

  async reorderScreens(versionId: string, screenIds: string[]): Promise<void> {
    const version = await this.prisma.codexVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException(`Version ${versionId} not found`);
    if (version.status !== CODEX_VERSION_STATUS.DRAFT) {
      throw new ForbiddenException('Only DRAFT versions allow reordering');
    }

    await this.prisma.$transaction(
      screenIds.map((id, index) =>
        this.prisma.codexScreen.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }
}
