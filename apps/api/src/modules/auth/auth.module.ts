import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from '../../common/email/email.service';
import { InviteModule } from '../invite';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Cast to satisfy @nestjs/jwt's StringValue type — value is a valid ms string
          expiresIn: (config.get('JWT_EXPIRES_IN') ?? '15m') as '15m',
          issuer: 'heimdal',
        },
      }),
      inject: [ConfigService],
    }),
    InviteModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService],
  exports: [AuthService, EmailService, JwtModule],
})
export class AuthModule {}
