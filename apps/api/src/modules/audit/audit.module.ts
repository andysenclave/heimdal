import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

/**
 * Audit Module — Event logging for auth, guard, and admin actions.
 * Stub for Month 1. Guard decision logging in HD-025 (Week 3).
 */
@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
