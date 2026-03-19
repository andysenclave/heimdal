import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { AuditService } from '../audit';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';

@Injectable()
export class OrgService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateOrgDto) {
    const slug = dto.slug ?? this.slugify(dto.name);

    const existing = await this.prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Organization with slug "${slug}" already exists`);
    }

    const result = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        plan: dto.plan ?? 'free',
      },
      include: { _count: { select: { applications: true, memberships: true } } },
    });

    this.auditService.log({
      action: 'org.create',
      resourceType: 'Organization',
      resourceId: result.id,
      metadata: { name: result.name, slug: result.slug },
    }).catch(() => {});

    return result;
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
    const org = await this.findOne(id);
    // @ts-expect-error isSystem pending migration - schema change adds this field
    if (org.isSystem && (dto.name !== undefined || dto.slug !== undefined)) {
      throw new ForbiddenException('System organization name and slug cannot be modified');
    }

    if (dto.slug) {
      const existing = await this.prisma.organization.findFirst({
        where: { slug: dto.slug, id: { not: id }, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException(`Organization with slug "${dto.slug}" already exists`);
      }
    }

    const result = await this.prisma.organization.update({
      where: { id },
      data: dto,
      include: { _count: { select: { applications: true, memberships: true } } },
    });

    this.auditService.log({
      action: 'org.update',
      resourceType: 'Organization',
      resourceId: result.id,
      metadata: { changes: dto },
    }).catch(() => {});

    return result;
  }

  async remove(id: string, currentUserId?: string) {
    const org = await this.findOne(id);
    // @ts-expect-error isSystem pending migration - schema change adds this field
    if (org.isSystem) {
      throw new ForbiddenException('System organization cannot be deleted');
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Soft-delete the org
      const deleted = await tx.organization.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
        include: { _count: { select: { applications: true, memberships: true } } },
      });

      // FIX-04: Session invalidation for users whose only org is this one
      if (currentUserId !== undefined) {
        const memberships = await tx.orgMembership.findMany({
          where: { orgId: id },
          select: { userId: true },
        });
        const memberUserIds = memberships.map((m) => m.userId);

        // Find users who have no other org memberships (single query instead of N+1 loop)
        const usersWithOtherOrgs = await tx.orgMembership.groupBy({
          by: ['userId'],
          where: { userId: { in: memberUserIds }, orgId: { not: id } },
        });
        const usersWithOtherOrgIds = new Set(usersWithOtherOrgs.map((u) => u.userId));
        const orphanedUserIds = memberUserIds.filter((uid) => !usersWithOtherOrgIds.has(uid));

        if (orphanedUserIds.length > 0) {
          await tx.session.deleteMany({ where: { userId: { in: orphanedUserIds } } });
        }
      }

      return deleted;
    });

    this.auditService.log({
      action: 'org.delete',
      resourceType: 'Organization',
      resourceId: deleted.id,
      metadata: { name: deleted.name },
    }).catch(() => {});

    return deleted;
  }

  async transferOwnership(orgId: string, fromUserId: string, toUserId: string): Promise<void> {
    const currentOwnerMembership = await this.prisma.orgMembership.findFirst({
      where: { orgId, userId: fromUserId, role: 'owner' },
    });
    if (!currentOwnerMembership) {
      throw new ForbiddenException('Only the current organization owner can transfer ownership');
    }

    const targetMembership = await this.prisma.orgMembership.findFirst({
      where: { orgId, userId: toUserId },
    });
    if (!targetMembership) {
      throw new NotFoundException('Target user is not a member of this organization');
    }

    await this.prisma.$transaction([
      this.prisma.orgMembership.update({
        where: { id: currentOwnerMembership.id },
        data: { role: 'admin' },
      }),
      this.prisma.orgMembership.update({
        where: { id: targetMembership.id },
        data: { role: 'owner' },
      }),
    ]);
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
