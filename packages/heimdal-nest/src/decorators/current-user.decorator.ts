import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { HeimdalJwtClaims } from '@heimdal/shared';

/**
 * Extracts the verified Heimdal user from the current request.
 *
 * Requires @HeimdalGuard() to have run first — the guard populates `req.user`.
 *
 * Usage — full user object:
 * ```ts
 * @Get('profile')
 * @HeimdalGuard()
 * getProfile(@CurrentUser() user: HeimdalJwtClaims) {
 *   return user;
 * }
 * ```
 *
 * Usage — single field:
 * ```ts
 * @Get('me')
 * @HeimdalGuard()
 * getMe(@CurrentUser('sub') userId: string) {
 *   return { userId };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (field: keyof HeimdalJwtClaims | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: HeimdalJwtClaims }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
