import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EntitlementService } from './entitlement.service';

@ApiTags('admin/entitlements')
@ApiBearerAuth()
@Controller('admin')
export class EntitlementController {
  constructor(private readonly entitlementService: EntitlementService) {}

  // --- Roles ---

  @Post('apps/:appId/roles')
  @ApiOperation({ summary: 'Create role in app context' })
  @ApiResponse({ status: 201, description: 'Role created' })
  async createRole(@Param('appId') appId: string, @Body() body: Record<string, unknown>) {
    return this.entitlementService.createRole(appId, body);
  }

  @Get('apps/:appId/roles')
  @ApiOperation({ summary: 'List roles for app' })
  async listRoles(@Param('appId') appId: string) {
    return this.entitlementService.listRoles(appId);
  }

  // --- Permissions ---

  @Post('apps/:appId/permissions')
  @ApiOperation({ summary: 'Create permission in app context' })
  @ApiResponse({ status: 201, description: 'Permission created' })
  async createPermission(@Param('appId') appId: string, @Body() body: Record<string, unknown>) {
    return this.entitlementService.createPermission(appId, body);
  }

  @Get('apps/:appId/permissions')
  @ApiOperation({ summary: 'List permissions for app' })
  async listPermissions(@Param('appId') appId: string) {
    return this.entitlementService.listPermissions(appId);
  }

  // --- Role-Permission assignment ---

  @Post('roles/:roleId/permissions')
  @ApiOperation({ summary: 'Assign permissions to role' })
  async assignPermissions(@Param('roleId') roleId: string, @Body() body: Record<string, unknown>) {
    return this.entitlementService.assignPermissions(roleId, body);
  }

  // --- User-App-Role assignment ---

  @Post('apps/:appId/users/:userId/roles')
  @ApiOperation({ summary: 'Assign role to user in app' })
  async assignUserRole(
    @Param('appId') appId: string,
    @Param('userId') userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.entitlementService.assignUserRole(appId, userId, body);
  }

  // --- Access bindings ---

  @Post('apps/:appId/bindings')
  @ApiOperation({ summary: 'Create access binding' })
  async createBinding(@Param('appId') appId: string, @Body() body: Record<string, unknown>) {
    return this.entitlementService.createBinding(appId, body);
  }

  @Get('apps/:appId/bindings')
  @ApiOperation({ summary: 'List access bindings for app' })
  async listBindings(@Param('appId') appId: string) {
    return this.entitlementService.listBindings(appId);
  }

  // --- Entitlement resolution ---

  @Get('apps/:appId/users/:userId/entitlements')
  @ApiOperation({ summary: 'Resolve effective permissions for user in app' })
  async resolveEntitlements(@Param('appId') appId: string, @Param('userId') userId: string) {
    return this.entitlementService.resolveEntitlements(appId, userId);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Remove permission from role' })
  async removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.entitlementService.removePermission(roleId, permissionId);
  }
}
