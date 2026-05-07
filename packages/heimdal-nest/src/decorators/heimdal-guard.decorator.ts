import { applyDecorators, UseGuards } from '@nestjs/common';
import { HeimdalGuardImpl } from '../guards/heimdal.guard';

/**
 * Protects a route or controller with Heimdal IAM.
 *
 * Apply at method or class level:
 *
 * ```ts
 * @HeimdalGuard()
 * @Get('sensitive-data')
 * getSensitiveData(@CurrentUser() user: HeimdalJwtClaims) { ... }
 * ```
 *
 * Resolves the request against the Heimdal guard check endpoint.
 * Use @CurrentUser() alongside this to extract the verified user.
 */
export function HeimdalGuard(): MethodDecorator & ClassDecorator {
  return applyDecorators(UseGuards(HeimdalGuardImpl));
}
