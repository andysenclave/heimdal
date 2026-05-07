import { DynamicModule, Module } from '@nestjs/common';
import { HeimdalGuardImpl } from './guards/heimdal.guard';

export interface HeimdalModuleOptions {
  /** Base URL of the Heimdal API. Example: https://heimdal.thimple.io */
  baseUrl: string;
  /** The App ID registered in Heimdal for this service. Sent as X-App-Id on guard check calls. */
  appId: string;
  /** Guard decision cache TTL in seconds. Defaults to 30. */
  cacheTtlSeconds?: number;
}

/**
 * Import HeimdalModule once at the root AppModule level.
 *
 * ```ts
 * // app.module.ts
 * @Module({
 *   imports: [
 *     HeimdalModule.register({
 *       baseUrl: process.env.HEIMDAL_URL,
 *       appId: process.env.HEIMDAL_APP_ID,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class HeimdalModule {
  static register(options: HeimdalModuleOptions): DynamicModule {
    return {
      module: HeimdalModule,
      global: true,
      providers: [
        {
          provide: 'HEIMDAL_OPTIONS',
          useValue: options,
        },
        {
          provide: HeimdalGuardImpl,
          useFactory: (opts: HeimdalModuleOptions) => new HeimdalGuardImpl(opts),
          inject: ['HEIMDAL_OPTIONS'],
        },
      ],
      exports: [HeimdalGuardImpl],
    };
  }
}
