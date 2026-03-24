import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('admin/audit')
@ApiBearerAuth()
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs with optional filters' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'orgId', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getLogs(
    @Query('action') action?: string,
    @Query('orgId') orgId?: string,
    @Query('actorId') actorId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.getLogs({
      action,
      orgId,
      actorId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
