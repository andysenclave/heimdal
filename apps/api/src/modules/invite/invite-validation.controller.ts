import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/guards/jwt-auth.guard';
import { InviteService } from './invite.service';

@ApiTags('auth')
@Controller('auth/invites')
export class InviteValidationController {
  constructor(private readonly inviteService: InviteService) {}

  @Public()
  @Get(':code/validate')
  @ApiOperation({ summary: 'Validate an invite code (public, does not consume)' })
  @ApiResponse({ status: 200, description: 'Returns validity, email, and expiry' })
  async validate(@Param('code') code: string) {
    return this.inviteService.validate(code);
  }
}
