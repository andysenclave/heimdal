import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaModule } from './common/prisma';
import { AuthModule } from './modules/auth';
import { OrgModule } from './modules/org';
import { ApplicationModule } from './modules/application';
import { EntitlementModule } from './modules/entitlement';
import { GuardModule } from './modules/guard';
import { CmsModule } from './modules/cms';
import { AuditModule } from './modules/audit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    OrgModule,
    ApplicationModule,
    EntitlementModule,
    GuardModule,
    CmsModule,
    AuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
