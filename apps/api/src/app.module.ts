import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth';
import { OrgModule } from './modules/org';
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
    AuthModule,
    OrgModule,
    EntitlementModule,
    GuardModule,
    CmsModule,
    AuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
