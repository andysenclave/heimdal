import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

const APP_INCLUDE = {
  _count: { select: { roles: true, permissions: true, accessBindings: true } },
} as const;

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApplicationDto) {
    // Validate org exists
    const org = await this.prisma.organization.findFirst({
      where: { id: dto.orgId, deletedAt: null },
    });
    if (!org) {
      throw new NotFoundException(`Organization "${dto.orgId}" not found`);
    }

    // Check name uniqueness within org
    const existing = await this.prisma.application.findFirst({
      where: { orgId: dto.orgId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Application "${dto.name}" already exists in this organization`,
      );
    }

    const plainSecret = randomBytes(32).toString('hex');
    const hashedSecret = createHash('sha256').update(plainSecret).digest('hex');
    const appId = `app_${randomBytes(12).toString('hex')}`;

    const app = await this.prisma.application.create({
      data: {
        orgId: dto.orgId,
        name: dto.name,
        description: dto.description,
        appId,
        appSecret: hashedSecret,
      },
      include: APP_INCLUDE,
    });

    // Return plaintext secret once — caller must store it
    return { ...app, appSecretPlain: plainSecret };
  }

  async findAll(orgId?: string) {
    return this.prisma.application.findMany({
      where: orgId ? { orgId } : undefined,
      include: APP_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: APP_INCLUDE,
    });
    if (!app) {
      throw new NotFoundException(`Application "${id}" not found`);
    }
    return app;
  }

  async update(id: string, dto: UpdateApplicationDto) {
    await this.findOne(id);
    return this.prisma.application.update({
      where: { id },
      data: dto,
      include: APP_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.application.delete({
      where: { id },
    });
  }
}
