import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * Register a new user.
   * Full BetterAuth integration in HD-010 (Week 2).
   */
  async signup(_body: Record<string, unknown>) {
    this.logger.log('Signup endpoint called — stub');
    return { message: 'Auth module ready. BetterAuth integration pending (HD-010).' };
  }

  /**
   * Authenticate user with email/password.
   */
  async login(_body: Record<string, unknown>) {
    this.logger.log('Login endpoint called — stub');
    return { message: 'Auth module ready. BetterAuth integration pending (HD-010).' };
  }

  /**
   * Invalidate the current session.
   */
  async logout() {
    this.logger.log('Logout endpoint called — stub');
    return { message: 'Logged out (stub)' };
  }

  /**
   * Refresh the access token using refresh token.
   */
  async refresh(_body: Record<string, unknown>) {
    this.logger.log('Refresh endpoint called — stub');
    return { message: 'Token refresh (stub)' };
  }

  /**
   * Get the current authenticated session.
   */
  async getSession() {
    this.logger.log('Get session endpoint called — stub');
    return { message: 'Session (stub)' };
  }
}
