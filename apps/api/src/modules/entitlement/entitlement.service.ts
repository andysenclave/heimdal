import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

const ROLE_INCLUDE = {
  parentRole: { select: { id: true, name: true } },
  _count: { select: { rolePermissions: true, userAppRoles: true } },
} as const;

@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Roles ────────────────────────────────────────────────────────────────

  async createRole(appId: string, dto: CreateRoleDto) {
    const app = await this.prisma.application.findUnique({ where: { id: appId } });
    if (!app) throw new NotFoundException(`Application "${appId}" not found`);

    const existing = await this.prisma.role.findUnique({
      where: { appId_name: { appId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists in this application`);
    }

    if (dto.parentRoleId) {
      const parent = await this.prisma.role.findUnique({ where: { id: dto.parentRoleId } });
      if (!parent) throw new NotFoundException(`Parent role "${dto.parentRoleId}" not found`);
      if (parent.appId !== appId)
        throw new BadRequestException('Parent role must belong to the same application');
    }

    return this.prisma.role.create({
      data: {
        orgId: dto.orgId,
        appId,
        name: dto.name,
        description: dto.description,
        parentRoleId: dto.parentRoleId,
        isSystem: dto.isSystem ?? false,
      },
      include: ROLE_INCLUDE,
    });
  }

  async listRoles(appId?: string) {
    return this.prisma.role.findMany({
      where: appId ? { appId } : undefined,
      include: ROLE_INCLUDE,
      orderBy: [{ appId: 'asc' }, { name: 'asc' }],
    });
  }

  async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: ROLE_INCLUDE,
    });
    if (!role) throw new NotFoundException(`Role "${id}" not found`);
    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.getRole(id);

    if (dto.name && dto.name !== role.name) {
      const conflict = await this.prisma.role.findUnique({
        where: { appId_name: { appId: role.appId, name: dto.name } },
      });
      if (conflict) {
        throw new ConflictException(`Role "${dto.name}" already exists in this application`);
      }
    }

    return this.prisma.role.update({ where: { id }, data: dto, include: ROLE_INCLUDE });
  }

  async deleteRole(id: string) {
    const role = await this.getRole(id);
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');
    return this.prisma.role.delete({ where: { id } });
  }

  // ─── Permissions ──────────────────────────────────────────────────────────

  async createPermission(appId: string, dto: CreatePermissionDto) {
    const app = await this.prisma.application.findUnique({ where: { id: appId } });
    if (!app) throw new NotFoundException(`Application "${appId}" not found`);

    const existing = await this.prisma.permission.findUnique({
      where: { appId_key: { appId, key: dto.key } },
    });
    if (existing) {
      throw new ConflictException(`Permission "${dto.key}" already exists in this application`);
    }

    return this.prisma.permission.create({
      data: { orgId: dto.orgId, appId, key: dto.key, description: dto.description },
    });
  }

  async listPermissions(appId?: string) {
    return this.prisma.permission.findMany({
      where: appId ? { appId } : undefined,
      orderBy: [{ appId: 'asc' }, { key: 'asc' }],
    });
  }

  async getPermission(id: string) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException(`Permission "${id}" not found`);
    return perm;
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    await this.getPermission(id);
    return this.prisma.permission.update({ where: { id }, data: dto });
  }

  async deletePermission(id: string) {
    await this.getPermission(id);
    return this.prisma.permission.delete({ where: { id } });
  }

  // ─── Role-Permission assignment ────────────────────────────────────────────

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    await this.getRole(roleId);
    await this.prisma.rolePermission.createMany({
      data: dto.permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        ...ROLE_INCLUDE,
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    await this.getRole(roleId);
    const assignment = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (!assignment) {
      throw new NotFoundException(`Permission not assigned to role`);
    }
    return this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }

  // ─── User-App-Role assignment ──────────────────────────────────────────────

  async assignUserRole(appId: string, userId: string, roleId: string) {
    const [app, user, role] = await Promise.all([
      this.prisma.application.findUnique({ where: { id: appId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.role.findUnique({ where: { id: roleId } }),
    ]);
    if (!app) throw new NotFoundException(`Application "${appId}" not found`);
    if (!user) throw new NotFoundException(`User "${userId}" not found`);
    if (!role) throw new NotFoundException(`Role "${roleId}" not found`);
    if (role.appId !== appId)
      throw new BadRequestException('Role does not belong to this application');

    return this.prisma.userAppRole.upsert({
      where: { userId_appId_roleId: { userId, appId, roleId } },
      create: { userId, appId, roleId },
      update: {},
    });
  }

  // ─── Access bindings ───────────────────────────────────────────────────────

  async createBinding(
    appId: string,
    permissionId: string,
    resource: string,
    description?: string,
  ) {
    const [app, perm] = await Promise.all([
      this.prisma.application.findUnique({ where: { id: appId } }),
      this.prisma.permission.findUnique({ where: { id: permissionId } }),
    ]);
    if (!app) throw new NotFoundException(`Application "${appId}" not found`);
    if (!perm) throw new NotFoundException(`Permission "${permissionId}" not found`);
    if (perm.appId !== appId)
      throw new BadRequestException('Permission does not belong to this application');

    return this.prisma.accessBinding.create({
      data: { appId, permissionId, resource, description },
      include: { permission: true },
    });
  }

  async listBindings(appId: string) {
    return this.prisma.accessBinding.findMany({
      where: { appId },
      include: { permission: true },
      orderBy: { resource: 'asc' },
    });
  }

  // ─── Entitlement resolution (stub — full engine in HD-022) ────────────────

  async resolveEntitlements(_appId: string, _userId: string) {
    return { permissions: [], message: 'Entitlement resolution engine pending (HD-022).' };
  }
}
