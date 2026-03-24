import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaModule } from './common/prisma';
import { AuthModule } from './modules/auth';
import { OrgModule } from './modules/org';
import { ApplicationModule } from './modules/application';
import { EntitlementModule } from './modules/entitlement';
import { InviteModule } from './modules/invite';
import { GuardModule } from './modules/guard';
import { CmsModule } from './modules/cms';
import { AuditModule } from './modules/audit';
import { DashboardModule } from './modules/dashboard';
import { SdkModule } from './modules/sdk';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HeimdalRolesGuard } from './common/guards/heimdal-roles.guard';
import { OrgScopeGuard } from './common/guards/org-scope.guard';
import { OrgMembershipGuard } from './common/guards/org-membership.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,   // @Global() — exports JwtModule globally, used by JwtAuthGuard below
    OrgModule,
    ApplicationModule,
    EntitlementModule,
    InviteModule,
    GuardModule,
    CmsModule,
    AuditModule,
    DashboardModule,
    SdkModule,
  ],
  controllers: [HealthController],
  providers: [
    // Guard execution order: JWT → Roles → OrgScope → OrgMembership
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: HeimdalRolesGuard },
    { provide: APP_GUARD, useClass: OrgScopeGuard },
    { provide: APP_GUARD, useClass: OrgMembershipGuard },
  ],
})
export class AppModule {}
