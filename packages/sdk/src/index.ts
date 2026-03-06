/**
 * @heimdal/sdk
 *
 * Heimdal IAM SDK — Authentication, Authorization, and Guard integration.
 *
 * Usage:
 *   import { HeimdalClient } from '@heimdal/sdk';
 *   import { HeimdalProvider, useAuth } from '@heimdal/sdk/react-native';
 */

export const SDK_VERSION = '0.1.0';

// Placeholder — auth module will be built in Week 4
export interface HeimdalConfig {
  baseUrl: string;
  appId: string;
}

export class HeimdalClient {
  private config: HeimdalConfig;

  constructor(config: HeimdalConfig) {
    this.config = config;
  }

  getConfig(): HeimdalConfig {
    return { ...this.config };
  }
}
