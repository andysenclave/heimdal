import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrgService } from './org.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { HeimdalJwtClaims } from '@heimdal/shared';

@ApiTags('admin/orgs')
@ApiBearerAuth()
@Controller('admin/orgs')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  async create(@Body() dto: CreateOrgDto) {
    return this.orgService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List organizations' })
  @ApiResponse({ status: 200, description: 'List of organizations' })
  async findAll() {
    return this.orgService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(@Param('id') id: string) {
    return this.orgService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrgDto) {
    return this.orgService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft) an organization' })
  @ApiResponse({ status: 200, description: 'Organization soft-deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: HeimdalJwtClaims) {
    return this.orgService.remove(id, user.sub);
  }

  @Post(':orgId/transfer-ownership')
  @ApiOperation({ summary: 'Transfer org ownership to another member' })
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
