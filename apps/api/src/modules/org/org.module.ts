import { Module } from '@nestjs/common';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { PrismaModule } from '../../common/prisma';
import { AuditModule } from '../audit';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [OrgController],
  providers: [OrgService],
  exports: [OrgService],
})
export class OrgModule {}
