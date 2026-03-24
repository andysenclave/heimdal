import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { OrgScoped } from '../../common/decorators/org-scoped.decorator';
import type { Request } from 'express';

@ApiTags('admin/apps')
@ApiBearerAuth()
@Controller('admin/apps')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @OrgScoped()
  @ApiOperation({ summary: 'Register a new application' })
  @ApiResponse({ status: 201, description: 'Application created. appSecretPlain returned once.' })
  async create(@Body() dto: CreateApplicationDto, @Req() req: Request) {
    // OrgScopeGuard sets resolvedOrgId for org-admins; platform admins use dto.orgId as-is
    const orgId = (req as Request & { resolvedOrgId?: string }).resolvedOrgId;
    if (orgId) {
      dto.orgId = orgId;
    }
    return this.applicationService.create(dto);
  }

  @Get()
  @OrgScoped()
  @ApiOperation({ summary: 'List applications' })
  @ApiQuery({ name: 'orgId', required: false, description: 'Filter by organization ID (platform admin only)' })
  @ApiResponse({ status: 200, description: 'List of applications' })
  async findAll(@Query('orgId') queryOrgId?: string, @Req() req?: Request) {
    const orgId = (req as Request & { resolvedOrgId?: string } | undefined)?.resolvedOrgId ?? queryOrgId;
    return this.applicationService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiResponse({ status: 200, description: 'Application details' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async findOne(@Param('id') id: string) {
    return this.applicationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update application' })
  @ApiResponse({ status: 200, description: 'Application updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete application' })
  @ApiResponse({ status: 200, description: 'Application deleted' })
  async remove(@Param('id') id: string) {
    return this.applicationService.remove(id);
  }
}
