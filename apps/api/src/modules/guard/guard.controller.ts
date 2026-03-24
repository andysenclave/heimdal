import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { GuardService } from './guard.service';

@ApiTags('guard')
@Controller('guard')
export class GuardController {
  constructor(private readonly guardService: GuardService) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-App-Id', description: 'Application identifier', required: true })
  @ApiHeader({ name: 'X-Request-Id', description: 'Request correlation ID', required: false })
  @ApiOperation({ summary: 'Check access — validate JWT and enforce entitlements' })
  @ApiResponse({
    status: 200,
    description: 'Guard decision (allowed or denied)',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired JWT' })
  @ApiResponse({ status: 403, description: 'Unregistered app or invalid app secret' })
  async check(
    @Headers('authorization') authorization: string,
    @Headers('x-app-id') appId: string,
    @Headers('x-request-id') requestId: string,
    @Body() body: { resource: string; context?: Record<string, string> },
  ) {
    return this.guardService.check({
      authorization,
      appId,
      requestId,
      resource: body.resource,
      context: body.context,
    });
  }
}
