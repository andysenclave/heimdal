import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from '../../common/prisma';
import { RegisterAppUserDto } from './dto/register-app-user.dto';
import { LoginAppUserDto } from './dto/login-app-user.dto';
import type { HeimdalJwtClaims } from '@heimdal/shared';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TTL_DAYS = 7;

/**
 * Handles SDK-facing user lifecycle: registration, login, token refresh.
 *
 * App users are NOT Heimdal admin users — they have no OrgMembership and cannot
 * access the Heimdal admin panel. They authenticate exclusively via these endpoints
 * and their JWTs carry aud: <appId> (public), which the JwtAuthGuard blocks from
 * all /admin/* and /auth/* routes.
 */
@Injectable()
export class SdkService {
  private readonly logger = new Logger(SdkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  async registerAppUser(
    app: { id: string; appId: string; orgId: string; name: string },
    dto: RegisterAppUserDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: Record<string, unknown>; sessionId: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const hashed = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const { user, session, accessToken, refreshToken } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashed,
          emailVerified: false,
          isHeimdalAdmin: false,
        },
      });

      // App membership — records that this user belongs to this app
      await tx.appMembership.create({
        data: { userId: user.id, appId: app.id },
      });

      const { accessToken, refreshToken, hashedRefresh, expiresAt } =
        this.generateTokenPair(user.id, app.orgId, app.appId, []);

      const session = await tx.session.create({
        data: { userId: user.id, token: hashedRefresh, expiresAt },
      });

      return { user, session, accessToken, refreshToken };
    });

    this.logger.log(`SDK register: ${dto.email} → app ${app.appId}`);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
      sessionId: session.id,
    };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async loginAppUser(
    app: { id: string; appId: string; orgId: string; name: string },
    dto: LoginAppUserDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: Record<string, unknown>; sessionId: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify this user is actually registered in this app
    const membership = await this.prisma.appMembership.findUnique({
      where: { userId_appId: { userId: user.id, appId: app.id } },
    });
    if (!membership) {
      throw new UnauthorizedException('User is not registered in this application');
    }

    // Resolve app-level roles
    const appRoles = await this.prisma.userAppRole.findMany({
      where: { userId: user.id, appId: app.id },
      include: { role: { select: { name: true } } },
    });
    const roles = appRoles.map((r) => r.role.name);

    const { accessToken, refreshToken, hashedRefresh, expiresAt } =
      this.generateTokenPair(user.id, app.orgId, app.appId, roles);

    const session = await this.prisma.session.create({
      data: { userId: user.id, token: hashedRefresh, expiresAt },
    });

    this.logger.log(`SDK login: ${dto.email} → app ${app.appId}`);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
      sessionId: session.id,
    };
  }

  // ─── Refresh ───────────────────────────────────────────────────────────────

  async refreshAppToken(
    app: { id: string; appId: string; orgId: string },
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');

    const session = await this.prisma.session.findUnique({ where: { token: hashedToken } });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Re-verify the user still belongs to this app
    const membership = await this.prisma.appMembership.findUnique({
      where: { userId_appId: { userId: user.id, appId: app.id } },
    });
    if (!membership) {
      throw new UnauthorizedException('User is not registered in this application');
    }

    const appRoles = await this.prisma.userAppRole.findMany({
      where: { userId: user.id, appId: app.id },
      include: { role: { select: { name: true } } },
    });
    const roles = appRoles.map((r) => r.role.name);

    const {
      accessToken,
      refreshToken: newRefreshToken,
      hashedRefresh,
      expiresAt,
    } = this.generateTokenPair(user.id, app.orgId, app.appId, roles);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { token: hashedRefresh, expiresAt },
    });

    return { accessToken, refreshToken: newRefreshToken, sessionId: session.id };
  }

  // ─── List app users (for admin panel) ─────────────────────────────────────

  async listAppUsers(appId: string): Promise<{ data: unknown[]; total: number }> {
    const memberships = await this.prisma.appMembership.findMany({
      where: { appId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const userIds = memberships.map((m) => m.userId);
    const appRoles = await this.prisma.userAppRole.findMany({
      where: { userId: { in: userIds }, appId },
      include: { role: { select: { id: true, name: true } } },
    });

    const rolesByUser = new Map<string, { id: string; name: string }[]>();
    for (const uar of appRoles) {
      const existing = rolesByUser.get(uar.userId) ?? [];
      existing.push(uar.role);
      rolesByUser.set(uar.userId, existing);
    }

    const data = memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      appId: m.appId,
      user: m.user,
      roles: rolesByUser.get(m.userId) ?? [],
      createdAt: m.createdAt,
    }));

    return { data, total: data.length };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private generateTokenPair(
    userId: string,
    orgId: string,
    aud: string,
    roles: string[],
  ): { accessToken: string; refreshToken: string; hashedRefresh: string; expiresAt: Date } {
    const sessionId = randomBytes(16).toString('hex');
    const jti = randomBytes(16).toString('hex');

    const payload: Omit<HeimdalJwtClaims, 'exp' | 'iat' | 'iss'> = {
      sub: userId,
      aud,
      org: orgId,
      roles,
      sessionId,
      jti,
    };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const hashedRefresh = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    return { accessToken, refreshToken, hashedRefresh, expiresAt };
  }
}
