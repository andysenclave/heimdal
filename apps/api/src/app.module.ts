import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

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
    GuardModule,
    CmsModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [
    // Apply JwtAuthGuard to every route — use @Public() to opt out
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
