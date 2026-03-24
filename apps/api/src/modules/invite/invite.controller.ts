import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InviteService } from './invite.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrgScoped } from '../../common/decorators/org-scoped.decorator';
import type { HeimdalJwtClaims } from '@heimdal/shared';
import type { Request } from 'express';

type ScopedRequest = Request & { resolvedOrgId?: string };

@ApiTags('admin/invites')
@ApiBearerAuth()
@Controller('admin/invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post()
  @OrgScoped()
  @ApiOperation({ summary: 'Create an invite for a new user' })
  @ApiResponse({ status: 201, description: 'Invite created with code' })
  @ApiResponse({ status: 403, description: 'Org-admin cannot assign owner role or invite to other orgs' })
  @ApiResponse({ status: 409, description: 'Pending invite already exists for this email in this org' })
  async create(
    @Body() dto: CreateInviteDto,
    @CurrentUser() claims: HeimdalJwtClaims,
    @Req() req: ScopedRequest,
  ) {
    // OrgScopeGuard sets resolvedOrgId for org-admins — force their orgId
    if (req.resolvedOrgId) {
      dto.orgId = req.resolvedOrgId;
    }
    return this.inviteService.create(dto, claims.sub);
  }

  @Get()
  @OrgScoped()
  @ApiOperation({ summary: 'List invites (org-admins see only their org)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] })
  @ApiQuery({ name: 'orgId', required: false, description: 'Platform admin only — filter by org' })
  @ApiResponse({ status: 200, description: 'List of invites' })
  async findAll(
    @Query('status') status?: string,
    @Query('orgId') queryOrgId?: string,
    @Req() req?: ScopedRequest,
  ) {
    const orgId = req?.resolvedOrgId ?? queryOrgId;
    return this.inviteService.findAll(orgId, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a pending invite' })
  @ApiResponse({ status: 200, description: 'Invite revoked' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 400, description: 'Invite cannot be revoked (not PENDING)' })
  async revoke(@Param('id') id: string) {
    return this.inviteService.revoke(id);
  }
}
