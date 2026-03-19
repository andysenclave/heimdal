import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaModule } from '../../common/prisma';

/**
 * Audit Module — Event logging for auth, guard, and admin actions.
 * Full implementation for logging to AuditLog table.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
