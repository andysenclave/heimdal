import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { generateInviteCode } from './utils/invite-code';
import { CreateInviteDto } from './dto/create-invite.dto';

const INVITE_TTL_HOURS = 48;
const MAX_CODE_RETRIES = 3;

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create Invite ──────────────────────────────────────────────────────

  async create(dto: CreateInviteDto, invitedById: string) {
    const emailLower = dto.email.toLowerCase();
    const orgRole = dto.orgRole ?? 'member';
    const isOrgInvite = !!dto.orgId;

    // Verify target org exists (only for org invites)
    if (isOrgInvite) {
      const org = await this.prisma.organization.findUnique({ where: { id: dto.orgId } });
      if (!org) throw new NotFoundException(`Organization "${dto.orgId}" not found`);
    }

    // Determine if inviter is a platform admin
    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
      select: { isHeimdalAdmin: true },
    });

    // Org-admins cannot invite as 'owner' or create Heimdal Admin invites
    if (!inviter?.isHeimdalAdmin && orgRole === 'owner') {
      throw new ForbiddenException('Only platform admins can assign the owner role');
    }
    if (!inviter?.isHeimdalAdmin && !isOrgInvite) {
      throw new ForbiddenException('Only platform admins can create Heimdal Admin invites');
    }

    // Member invites require an appId
    if (isOrgInvite && orgRole === 'member' && !dto.appId) {
      throw new BadRequestException('An application must be selected for member invites');
    }

    // Validate appId belongs to the org
    if (dto.appId && dto.orgId) {
      const app = await this.prisma.application.findFirst({
        where: { id: dto.appId, orgId: dto.orgId },
      });
      if (!app) {
        throw new BadRequestException('Application does not belong to the specified organization');
      }
    }

    // Reject duplicate pending invite
    const existingWhere = isOrgInvite
      ? { email: emailLower, orgId: dto.orgId, status: 'PENDING' as const, expiresAt: { gt: new Date() } }
      : { email: emailLower, orgId: null, status: 'PENDING' as const, expiresAt: { gt: new Date() } };

    const existing = await this.prisma.invite.findFirst({ where: existingWhere });
    if (existing) {
      throw new ConflictException(
        isOrgInvite
          ? 'A pending invite already exists for this email in this organization'
          : 'A pending Heimdal Admin invite already exists for this email',
      );
    }

    // Generate unique code with retry
    let code: string | null = null;
    for (let i = 0; i < MAX_CODE_RETRIES; i++) {
      const candidate = generateInviteCode();
      const clash = await this.prisma.invite.findUnique({ where: { code: candidate } });
      if (!clash) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      throw new BadRequestException('Failed to generate unique invite code. Please try again.');
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

    const invite = await this.prisma.invite.create({
      data: {
        code,
        email: emailLower,
        orgId: dto.orgId ?? null,
        orgRole,
        appId: dto.appId ?? null,
        invitedById,
        expiresAt,
      },
      select: {
        id: true,
        code: true,
        email: true,
        orgId: true,
        orgRole: true,
        appId: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        org: { select: { id: true, name: true } },
        app: { select: { id: true, name: true, appId: true } },
        invitedBy: { select: { id: true, email: true, name: true } },
      },
    });

    this.logger.log(
      `Invite created: ${code} → ${emailLower} (${isOrgInvite ? `org: ${dto.orgId}, role: ${orgRole}` : 'platform-admin'}) by ${invitedById}`,
    );
    return invite;
  }

  // ─── List Invites ──────────────────────────────────────────────────────

  async findAll(orgId?: string, status?: string) {
    const where: Record<string, unknown> = {};

    if (orgId) {
      where['orgId'] = orgId;
    }

    if (status && ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'].includes(status)) {
      where['status'] = status;
    }

    const invites = await this.prisma.invite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        email: true,
        orgId: true,
        orgRole: true,
        appId: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        org: { select: { id: true, name: true } },
        app: { select: { id: true, name: true, appId: true } },
        invitedBy: { select: { id: true, email: true, name: true } },
        acceptedBy: { select: { id: true, email: true, name: true } },
      },
    });

    return invites;
  }

  // ─── Revoke Invite ──────────────────────────────────────────────────────

  async revoke(id: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot revoke an invite with status '${invite.status}'`,
      );
    }

    const updated = await this.prisma.invite.update({
      where: { id },
      data: { status: 'REVOKED' },
      select: {
        id: true,
        code: true,
        email: true,
        status: true,
      },
    });

    this.logger.log(`Invite revoked: ${updated.code} (${updated.email})`);
    return updated;
  }

  // ─── Validate Invite Code (Public) ──────────────────────────────────────

  async validate(code: string): Promise<{ valid: boolean; email?: string; expiresAt?: Date; orgId?: string | null }> {
    const invite = await this.prisma.invite.findUnique({ where: { code } });

    if (!invite) return { valid: false };
    if (invite.status !== 'PENDING') return { valid: false };
    if (invite.expiresAt < new Date()) return { valid: false };

    return {
      valid: true,
      email: invite.email,
      expiresAt: invite.expiresAt,
      orgId: invite.orgId,
    };
  }

  // ─── Consume Invite (called during signup) ──────────────────────────────

  async consumeInvite(
    code: string,
    email: string,
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ) {
    const invite = await tx.invite.findUnique({ where: { code } });

    if (!invite) throw new BadRequestException('Invalid invite code');
    if (invite.status === 'ACCEPTED') throw new BadRequestException('This invite has already been used');
    if (invite.status === 'REVOKED') throw new BadRequestException('This invite has been revoked');
    if (invite.status !== 'PENDING') throw new BadRequestException('Invalid invite code');
    if (invite.expiresAt < new Date()) throw new BadRequestException('This invite has expired');
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException('Email does not match the invite');
    }

    return invite;
  }

  async markAccepted(
    inviteId: string,
    userId: string,
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ) {
    await tx.invite.update({
      where: { id: inviteId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedByUserId: userId,
      },
    });
  }
}
