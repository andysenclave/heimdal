import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import type { HeimdalJwtClaims } from '@heimdal/shared';

export const IS_PUBLIC_KEY = 'isPublic';

/** Mark a controller or route as publicly accessible (no JWT required). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const claims = this.jwt.verify<HeimdalJwtClaims>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      // Attach claims to request for downstream use (@CurrentUser() decorator)
      (request as Request & { user: HeimdalJwtClaims }).user = claims;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractBearer(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
