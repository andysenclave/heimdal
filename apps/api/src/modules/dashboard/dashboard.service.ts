import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

export interface DashboardStats {
  orgCount: number;
  appCount: number;
  userCount: number;
  roleCount: number;
  permissionCount: number;
  pendingInviteCount: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const [orgCount, appCount, userCount, roleCount, permissionCount, pendingInviteCount] =
      await Promise.all([
        this.prisma.organization.count({ where: { deletedAt: null } }),
        this.prisma.application.count({ where: { isActive: true } }),
        this.prisma.user.count(),
        this.prisma.role.count(),
        this.prisma.permission.count(),
        this.prisma.invite.count({ where: { status: 'PENDING' } }),
      ]);

    return { orgCount, appCount, userCount, roleCount, permissionCount, pendingInviteCount };
  }
}
