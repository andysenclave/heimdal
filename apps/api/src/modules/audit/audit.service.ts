import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  /**
   * Log an audit event asynchronously.
   * Used by guard, auth, and admin modules.
   * Full implementation as stretch goal (S1) or HD-025.
   */
  async log(event: {
    action: string;
    actorId?: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  }) {
    this.logger.debug(`Audit: ${event.action} — stub`);
    // Will write to AuditLog table once Prisma is connected
  }

  async getLogs(limit: number) {
    this.logger.log(`Get audit logs (limit: ${limit}) — stub`);
    return { logs: [], message: 'Audit module ready. Full logging pending.' };
  }
}
