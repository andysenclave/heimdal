import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrgService } from './org.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgScoped } from '../../common/decorators/org-scoped.decorator';
import { HEIMDAL_ROLES } from '@heimdal/shared';
import type { HeimdalJwtClaims } from '@heimdal/shared';

@ApiTags('admin/orgs')
@ApiBearerAuth()
@Controller('admin/orgs')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Post()
  @Roles(HEIMDAL_ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create organization (platform admin only)' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 403, description: 'Requires platform admin role' })
  async create(@Body() dto: CreateOrgDto) {
    return this.orgService.create(dto);
  }

  @Get()
  @Roles(HEIMDAL_ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all organizations (platform admin only)' })
  @ApiResponse({ status: 200, description: 'List of organizations' })
  @ApiResponse({ status: 403, description: 'Requires platform admin role' })
  async findAll() {
    return this.orgService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: "Get caller's bound organization (accessible to all roles)" })
  @ApiResponse({ status: 200, description: 'Organization details' })
  async getMyOrg(@CurrentUser() claims: HeimdalJwtClaims) {
    return this.orgService.findOne(claims.org);
  }

  @Get(':id')
  @Roles(HEIMDAL_ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get organization by ID (platform admin only)' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(@Param('id') id: string) {
    return this.orgService.findOne(id);
  }

  @Patch(':id')
  @Roles(HEIMDAL_ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update organization (platform admin only)' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrgDto) {
    return this.orgService.update(id, dto);
  }

  @Delete(':id')
  @Roles(HEIMDAL_ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Delete (soft) an organization (platform admin only)' })
  @ApiResponse({ status: 200, description: 'Organization soft-deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: HeimdalJwtClaims) {
    return this.orgService.remove(id, user.sub);
  }

  @Get(':orgId/members')
  @Roles(HEIMDAL_ROLES.PLATFORM_ADMIN, HEIMDAL_ROLES.ORG_ADMIN)
  @OrgScoped()
  @ApiOperation({ summary: 'List members of an organization (platform admin or own org admin)' })
  @ApiResponse({ status: 200, description: 'List of org members' })
  async getMembers(@Param('orgId') orgId: string) {
    return this.orgService.getMembers(orgId);
  }

  @Patch(':orgId/members/:userId')
  @Roles(HEIMDAL_ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: "Update a member's role (platform admin only)" })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  async updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() claims: HeimdalJwtClaims,
  ) {
    return this.orgService.updateMemberRole(orgId, userId, dto.role, claims.sub);
  }

  @Delete(':orgId/members/:userId')
  @Roles(HEIMDAL_ROLES.PLATFORM_ADMIN, HEIMDAL_ROLES.ORG_ADMIN)
  @OrgScoped()
  @ApiOperation({ summary: 'Remove a member from an organization (platform admin or own org admin)' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @CurrentUser() claims: HeimdalJwtClaims,
  ) {
    await this.orgService.removeMember(orgId, userId, claims.sub);
    return { success: true };
  }

  @Post(':orgId/transfer-ownership')
  @Roles(HEIMDAL_ROLES.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Transfer org ownership (platform admin only)' })
  @ApiResponse({ status: 200, description: 'Ownership transferred' })
  async transferOwnership(
    @Param('orgId') orgId: string,
    @Body('toUserId') toUserId: string,
    @CurrentUser() user: HeimdalJwtClaims,
  ) {
    await this.orgService.transferOwnership(orgId, user.sub, toUserId);
    return { success: true };
  }
}
