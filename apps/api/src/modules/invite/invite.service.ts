import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
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

    // Reject if a PENDING invite already exists for this email
    const existing = await this.prisma.invite.findFirst({
      where: {
        email: emailLower,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) {
      throw new ConflictException(
        'A pending invite already exists for this email address',
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
        invitedById,
        expiresAt,
      },
      select: {
        id: true,
        code: true,
        email: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    this.logger.log(`Invite created: ${code} → ${emailLower} by user ${invitedById}`);
    return invite;
  }

  // ─── List Invites ──────────────────────────────────────────────────────

  async findAll(status?: string) {
    const where: Record<string, unknown> = {};

    if (status && ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'].includes(status)) {
      where.status = status;
    }

    const invites = await this.prisma.invite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        email: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        invitedBy: {
          select: { id: true, email: true, name: true },
        },
        acceptedBy: {
          select: { id: true, email: true, name: true },
        },
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

  async validate(code: string): Promise<{ valid: boolean; email?: string; expiresAt?: Date }> {
    const invite = await this.prisma.invite.findUnique({ where: { code } });

    if (!invite) {
      return { valid: false };
    }

    if (invite.status !== 'PENDING') {
      return { valid: false };
    }

    if (invite.expiresAt < new Date()) {
      return { valid: false };
    }

    return {
      valid: true,
      email: invite.email,
      expiresAt: invite.expiresAt,
    };
  }

  // ─── Consume Invite (called during signup) ──────────────────────────────

  async consumeInvite(
    code: string,
    email: string,
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ) {
    const invite = await tx.invite.findUnique({ where: { code } });

    if (!invite) {
      throw new BadRequestException('Invalid invite code');
    }

    if (invite.status === 'ACCEPTED') {
      throw new BadRequestException('This invite has already been used');
    }

    if (invite.status === 'REVOKED') {
      throw new BadRequestException('This invite has been revoked');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Invalid invite code');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('This invite has expired');
    }

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
