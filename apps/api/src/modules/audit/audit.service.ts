import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma';

export interface AuditEvent {
  action: string;
  actorId?: string;
  orgId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export interface AuditLogFilters {
  orgId?: string;
  actorId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          orgId: event.orgId ?? null,
          actorId: event.actorId ?? null,
          action: event.action,
          resourceType: event.resourceType ?? null,
          resourceId: event.resourceId ?? null,
          metadata: (event.metadata ?? {}) as Prisma.InputJsonValue,
          ipAddress: event.ipAddress ?? null,
        },
      });
    } catch (err) {
      this.logger.warn('Audit log write failed', err instanceof Error ? err.message : String(err));
    }
  }

  async getLogs(filters?: AuditLogFilters) {
    const where: Record<string, unknown> = {};
    if (filters?.orgId) where['orgId'] = filters.orgId;
    if (filters?.actorId) where['actorId'] = filters.actorId;
    if (filters?.action) where['action'] = { contains: filters.action, mode: 'insensitive' };

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page: Math.floor(offset / limit) + 1, pageSize: limit };
  }
}
