import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
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
import type { HeimdalJwtClaims } from '@heimdal/shared';

@ApiTags('admin/invites')
@ApiBearerAuth()
@Controller('admin/invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post()
  @ApiOperation({ summary: 'Create an invite code for a new admin' })
  @ApiResponse({ status: 201, description: 'Invite created with code' })
  @ApiResponse({ status: 409, description: 'Pending invite already exists for this email' })
  async create(
    @Body() dto: CreateInviteDto,
    @CurrentUser() claims: HeimdalJwtClaims,
  ) {
    return this.inviteService.create(dto, claims.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List all invites (filterable by status)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] })
  @ApiResponse({ status: 200, description: 'List of invites' })
  async findAll(@Query('status') status?: string) {
    return this.inviteService.findAll(status);
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
