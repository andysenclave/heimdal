import { Module } from '@nestjs/common';
import { GuardController } from './guard.controller';
import { GuardService } from './guard.service';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../../common/prisma';

@Module({
  imports: [PrismaModule, EntitlementModule, AuditModule],
  controllers: [GuardController],
  providers: [GuardService],
  exports: [GuardService],
})
export class GuardModule {}
