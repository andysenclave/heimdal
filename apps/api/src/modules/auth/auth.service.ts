import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../common/prisma';
import type { HeimdalJwtClaims } from '@heimdal/shared';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ─── Signup ──────────────────────────────────────────────────────────────

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const hashed = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Transaction: create User → default Org → OrgMembership (HD-011)
    const { user, org, session, accessToken, refreshToken } = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            name: dto.name,
            password: hashed,
            emailVerified: false,
          },
        });

        // Auto-create a personal org for the user (HD-011 hook)
        const orgSlug = this.slugify(dto.name ?? dto.email.split('@')[0]);
        const org = await tx.organization.create({
          data: {
            name: dto.name ? `${dto.name}'s Org` : dto.email.split('@')[0],
            slug: await this.uniqueSlug(orgSlug, tx),
          },
        });

        // Make the user the owner of their org (HD-011 hook)
        await tx.orgMembership.create({
          data: { userId: user.id, orgId: org.id, role: 'owner' },
        });

        const { accessToken, refreshToken, hashedRefresh, expiresAt } =
          await this.generateTokenPair(user.id, org.id, 'heimdal-admin', ['owner']);

        const session = await tx.session.create({
          data: { userId: user.id, token: hashedRefresh, expiresAt },
        });

        return { user, org, session, accessToken, refreshToken };
      },
    );

    this.logger.log(`Signup: ${user.email} → org ${org.id}`);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, orgId: org.id },
      sessionId: session.id,
    };
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Resolve primary org
    const membership = await this.prisma.orgMembership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) {
      throw new UnauthorizedException('User has no organization membership');
    }

    // Resolve roles: org-level role + app-level roles (if appId given)
    const roles = await this.resolveRoles(user.id, membership.orgId, dto.appId);
    const aud = dto.appId ?? 'heimdal-admin';

    const { accessToken, refreshToken, hashedRefresh, expiresAt } = await this.generateTokenPair(
      user.id,
      membership.orgId,
      aud,
      roles,
    );

    const session = await this.prisma.session.create({
      data: { userId: user.id, token: hashedRefresh, expiresAt },
    });

    this.logger.log(`Login: ${user.email} → org ${membership.orgId} aud ${aud}`);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, orgId: membership.orgId },
      sessionId: session.id,
    };
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────

  async refresh(dto: RefreshDto) {
    const hashedToken = this.hashRefreshToken(dto.refreshToken);

    const session = await this.prisma.session.findUnique({ where: { token: hashedToken } });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    try {
      // Resolve fresh from DB (can't validate expired AT)
      const membership = await this.prisma.orgMembership.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });
      if (!membership) throw new Error('No membership');

      const roles = await this.resolveRoles(user.id, membership.orgId, undefined);
      const { accessToken, refreshToken, hashedRefresh, expiresAt } = await this.generateTokenPair(
        user.id,
        membership.orgId,
        'heimdal-admin',
        roles,
      );

      // Rotate refresh token
      await this.prisma.session.update({
        where: { id: session.id },
        data: { token: hashedRefresh, expiresAt },
      });

      this.logger.log(`Refresh: user ${user.id}`);
      return { accessToken, refreshToken, sessionId: session.id };
    } catch {
      throw new UnauthorizedException('Could not refresh token');
    }
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  async logout(dto: RefreshDto) {
    const hashedToken = this.hashRefreshToken(dto.refreshToken);
    await this.prisma.session.deleteMany({ where: { token: hashedToken } });
    this.logger.log('Logout: session invalidated');
    return { message: 'Logged out successfully' };
  }

  // ─── Get Session ─────────────────────────────────────────────────────────

  async getSession(claims: HeimdalJwtClaims) {
    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      user,
      session: {
        id: claims.sessionId,
        orgId: claims.org,
        aud: claims.aud,
        roles: claims.roles,
        expiresAt: new Date(claims.exp * 1000).toISOString(),
      },
    };
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  private async generateTokenPair(
    userId: string,
    orgId: string,
    aud: string,
    roles: string[],
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    hashedRefresh: string;
    expiresAt: Date;
  }> {
    const sessionId = randomBytes(16).toString('hex');
    const jti = randomBytes(16).toString('hex');

    // iss is set via JwtModule signOptions.issuer — don't duplicate in payload
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
    const hashedRefresh = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    return { accessToken, refreshToken, hashedRefresh, expiresAt };
  }

  private hashRefreshToken(token: string): string {
    // Store a SHA-256 hash — never persist raw refresh tokens
    return createHash('sha256').update(token).digest('hex');
  }

  private async resolveRoles(
    userId: string,
    orgId: string,
    appId: string | undefined,
  ): Promise<string[]> {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });

    const orgRole = membership?.role ?? 'member';

    if (!appId) return [orgRole];

    const appRoles = await this.prisma.userAppRole.findMany({
      where: { userId, appId },
      include: { role: { select: { name: true } } },
    });

    const roleNames = appRoles.map((r) => r.role.name);
    return [orgRole, ...roleNames];
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async uniqueSlug(
    base: string,
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<string> {
    let slug = base;
    let attempt = 0;
    while (true) {
      const exists = await tx.organization.findUnique({ where: { slug } });
      if (!exists) return slug;
      attempt++;
      slug = `${base}-${attempt}`;
    }
  }
}
