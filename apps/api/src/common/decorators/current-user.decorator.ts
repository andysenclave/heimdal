import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { HeimdalJwtClaims } from '@heimdal/shared';

/** Extracts the verified HeimdalJwtClaims attached by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): HeimdalJwtClaims => {
    const request = ctx.switchToHttp().getRequest<Request & { user: HeimdalJwtClaims }>();
    return request.user;
  },
);
