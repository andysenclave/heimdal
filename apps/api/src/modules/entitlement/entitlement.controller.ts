import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EntitlementService } from './entitlement.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionsDto,
} from './dto';
import { OrgScoped } from '../../common/decorators/org-scoped.decorator';
import { OrgWriteAccess } from '../../common/guards/org-membership.guard';
import type { Request } from 'express';

type ScopedRequest = Request & { resolvedOrgId?: string };

@ApiTags('admin/entitlements')
@ApiBearerAuth()
@Controller('admin')
export class EntitlementController {
  constructor(private readonly entitlementService: EntitlementService) {}

  // ─── Roles (nested — create) ───────────────────────────────────────────────

  @Post('apps/:appId/roles')
  @OrgScoped()
  @ApiOperation({ summary: 'Create role in app context' })
  @ApiResponse({ status: 201, description: 'Role created' })
  async createRole(@Param('appId') appId: string, @Body() dto: CreateRoleDto) {
    return this.entitlementService.createRole(appId, dto);
  }

  @Get('apps/:appId/roles')
  @OrgScoped()
  @ApiOperation({ summary: 'List roles for a specific app' })
  async listRolesForApp(@Param('appId') appId: string, @Req() req: ScopedRequest) {
    return this.entitlementService.listRoles(appId, req.resolvedOrgId);
  }

  // ─── Roles (flat — list / read / update / delete) ─────────────────────────

  @Get('roles')
  @OrgScoped()
  @ApiOperation({ summary: 'List all roles (optional appId/orgId filter)' })
  @ApiQuery({ name: 'appId', required: false })
  @ApiQuery({ name: 'orgId', required: false, description: 'Platform admin only — filter by org' })
  async listRoles(@Query('appId') appId?: string, @Query('orgId') queryOrgId?: string, @Req() req?: ScopedRequest) {
    const orgId = req?.resolvedOrgId ?? queryOrgId;
    return this.entitlementService.listRoles(appId, orgId);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role by ID' })
  async getRole(@Param('id') id: string) {
    return this.entitlementService.getRole(id);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update role' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.entitlementService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @OrgWriteAccess()
  @ApiOperation({ summary: 'Delete role (non-system only)' })
  async deleteRole(@Param('id') id: string) {
    return this.entitlementService.deleteRole(id);
  }

  // ─── Permissions (nested — create) ────────────────────────────────────────

  @Post('apps/:appId/permissions')
  @OrgScoped()
  @ApiOperation({ summary: 'Create permission in app context' })
  @ApiResponse({ status: 201, description: 'Permission created' })
  async createPermission(@Param('appId') appId: string, @Body() dto: CreatePermissionDto) {
    return this.entitlementService.createPermission(appId, dto);
  }

  @Get('apps/:appId/permissions')
  @OrgScoped()
  @ApiOperation({ summary: 'List permissions for a specific app' })
  async listPermissionsForApp(@Param('appId') appId: string, @Req() req: ScopedRequest) {
    return this.entitlementService.listPermissions(appId, req.resolvedOrgId);
  }

  // ─── Permissions (flat — list / read / update / delete) ───────────────────

  @Get('permissions')
  @OrgScoped()
  @ApiOperation({ summary: 'List all permissions (optional appId/orgId filter)' })
  @ApiQuery({ name: 'appId', required: false })
  @ApiQuery({ name: 'orgId', required: false, description: 'Platform admin only — filter by org' })
  async listPermissions(@Query('appId') appId?: string, @Query('orgId') queryOrgId?: string, @Req() req?: ScopedRequest) {
    const orgId = req?.resolvedOrgId ?? queryOrgId;
    return this.entitlementService.listPermissions(appId, orgId);
  }

  @Get('permissions/:id')
  @ApiOperation({ summary: 'Get permission by ID' })
  async getPermission(@Param('id') id: string) {
    return this.entitlementService.getPermission(id);
  }

  @Patch('permissions/:id')
  @ApiOperation({ summary: 'Update permission description' })
  async updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.entitlementService.updatePermission(id, dto);
  }

  @Delete('permissions/:id')
  @OrgWriteAccess()
  @ApiOperation({ summary: 'Delete permission' })
  async deletePermission(@Param('id') id: string) {
    return this.entitlementService.deletePermission(id);
  }

  // ─── Role-Permission assignment ────────────────────────────────────────────

  @Post('roles/:roleId/permissions')
  @ApiOperation({ summary: 'Assign permissions to role (bulk)' })
  async assignPermissions(@Param('roleId') roleId: string, @Body() dto: AssignPermissionsDto) {
    return this.entitlementService.assignPermissions(roleId, dto);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Remove permission from role' })
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.entitlementService.removePermissionFromRole(roleId, permissionId);
  }

  // ─── User-App-Role assignment ──────────────────────────────────────────────

  @Post('apps/:appId/users/:userId/roles')
  @OrgWriteAccess()
  @ApiOperation({ summary: 'Assign role to user in app context' })
  async assignUserRole(
    @Param('appId') appId: string,
    @Param('userId') userId: string,
    @Body('roleId') roleId: string,
  ) {
    return this.entitlementService.assignUserRole(appId, userId, roleId);
  }

  // ─── Access bindings ───────────────────────────────────────────────────────

  @Post('apps/:appId/bindings')
  @OrgWriteAccess()
  @ApiOperation({ summary: 'Create access binding' })
  async createBinding(
    @Param('appId') appId: string,
    @Body('permissionId') permissionId: string,
    @Body('resource') resource: string,
    @Body('description') description?: string,
  ) {
    return this.entitlementService.createBinding(appId, permissionId, resource, description);
  }

  @Get('apps/:appId/bindings')
  @ApiOperation({ summary: 'List access bindings for app' })
  async listBindings(@Param('appId') appId: string) {
    return this.entitlementService.listBindings(appId);
  }

  // ─── App Users (SDK-registered) ───────────────────────────────────────────

  @Get('apps/:appId/users')
  @OrgScoped()
  @ApiOperation({ summary: 'List SDK-registered users for an app' })
  async listAppUsers(@Param('appId') appId: string) {
    return this.entitlementService.listAppUsers(appId);
  }

  // ─── Entitlement resolution ────────────────────────────────────────────────

  @Get('apps/:appId/users/:userId/entitlements')
  @ApiOperation({ summary: 'Resolve effective permissions for user in app (stub)' })
  async resolveEntitlements(@Param('appId') appId: string, @Param('userId') userId: string) {
    return this.entitlementService.resolveEntitlements(appId, userId);
  }
}
