import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@ApiTags('admin/apps')
@ApiBearerAuth()
@Controller('admin/apps')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new application' })
  @ApiResponse({ status: 201, description: 'Application created. appSecretPlain returned once.' })
  async create(@Body() dto: CreateApplicationDto) {
    return this.applicationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List applications' })
  @ApiQuery({ name: 'orgId', required: false, description: 'Filter by organization ID' })
  @ApiResponse({ status: 200, description: 'List of applications' })
  async findAll(@Query('orgId') orgId?: string) {
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
