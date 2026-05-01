/**
 * @andysenclave/heimdal-nest
 *
 * Heimdal IAM SDK for NestJS.
 *
 * Quick start:
 *
 * 1. Register the module in your AppModule:
 *    ```ts
 *    HeimdalModule.register({ baseUrl: '...', appId: '...' })
 *    ```
 *
 * 2. Protect routes with the guard decorator:
 *    ```ts
 *    @HeimdalGuard()
 *    @Get('profile')
 *    getProfile(@CurrentUser() user: HeimdalJwtClaims) { ... }
 *    ```
 */

export { HeimdalModule } from './heimdal.module';
export type { HeimdalModuleOptions } from './heimdal.module';

export { HeimdalGuard } from './decorators/heimdal-guard.decorator';
export { CurrentUser } from './decorators/current-user.decorator';

// Re-export shared types so consumers don't need a separate @heimdal/shared install
export type {
  HeimdalJwtClaims,
  GuardCheckRequest,
  GuardCheckResponse,
} from '@heimdal/shared';
