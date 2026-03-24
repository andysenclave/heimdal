import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SdkController } from './sdk.controller';
import { SdkService } from './sdk.service';
import { PrismaModule } from '../../common/prisma';
import { AppSecretGuard } from '../../common/guards/app-secret.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
          issuer: 'heimdal',
        },
      }),
    }),
  ],
  controllers: [SdkController],
  providers: [SdkService, AppSecretGuard],
  exports: [SdkService],
})
export class SdkModule {}
