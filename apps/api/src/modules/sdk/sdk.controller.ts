import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SdkService } from './sdk.service';
import { RegisterAppUserDto, LoginAppUserDto, RefreshAppTokenDto } from './dto';
import { AppSecretGuard } from '../../common/guards/app-secret.guard';
import { Public } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

type SdkRequest = Request & {
  resolvedApp?: {
    id: string;
    appId: string;
    orgId: string;
    name: string;
  };
};

/**
 * SDK endpoints — authenticated via X-App-Secret header, NOT JWT Bearer tokens.
 * All routes are @Public() (skip JwtAuthGuard) and protected by AppSecretGuard instead.
 *
 * Users registered here are app-level end-users. They do NOT have OrgMembership
 * and cannot access the Heimdal admin panel.
 */
@ApiTags('sdk')
@Controller('sdk')
@Public()
@UseGuards(AppSecretGuard)
export class SdkController {
  constructor(private readonly sdkService: SdkService) {}

  @Post(':appId/users/register')
  @ApiOperation({ summary: 'Register a new app user (no invite required)' })
  @ApiResponse({ status: 201, description: 'User created and JWT issued' })
  async register(@Param('appId') _appId: string, @Req() req: SdkRequest, @Body() dto: RegisterAppUserDto) {
    return this.sdkService.registerAppUser(req.resolvedApp!, dto);
  }

  @Post(':appId/auth/login')
  @ApiOperation({ summary: 'Authenticate an app user, returns JWT' })
  @ApiResponse({ status: 200, description: 'Access + refresh tokens' })
  async login(@Param('appId') _appId: string, @Req() req: SdkRequest, @Body() dto: LoginAppUserDto) {
    return this.sdkService.loginAppUser(req.resolvedApp!, dto);
  }

  @Post(':appId/auth/refresh')
  @ApiOperation({ summary: 'Rotate app user refresh token' })
  async refresh(@Param('appId') _appId: string, @Req() req: SdkRequest, @Body() dto: RefreshAppTokenDto) {
    return this.sdkService.refreshAppToken(req.resolvedApp!, dto.refreshToken);
  }

  @Get(':appId/users')
  @ApiOperation({ summary: 'List all users registered in this app (admin use)' })
  async listUsers(@Param('appId') _appId: string, @Req() req: SdkRequest) {
    return this.sdkService.listAppUsers(req.resolvedApp!.id);
  }
}
