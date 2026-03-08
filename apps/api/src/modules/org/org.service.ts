import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrgDto) {
    const slug = dto.slug ?? this.slugify(dto.name);

    const existing = await this.prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Organization with slug "${slug}" already exists`);
    }

    return this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        plan: dto.plan ?? 'free',
      },
      include: { _count: { select: { applications: true, memberships: true } } },
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { applications: true, memberships: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { applications: true, memberships: true } } },
    });

    if (!org) {
      throw new NotFoundException(`Organization "${id}" not found`);
    }

    return org;
  }

  async update(id: string, dto: UpdateOrgDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.organization.findFirst({
        where: { slug: dto.slug, id: { not: id }, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException(`Organization with slug "${dto.slug}" already exists`);
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: dto,
      include: { _count: { select: { applications: true, memberships: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { _count: { select: { applications: true, memberships: true } } },
    });
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
