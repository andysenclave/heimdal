/**
 * Token storage — wraps localStorage for access + refresh token lifecycle.
 * Access token: in-memory preferred, localStorage as fallback for page reload.
 * Refresh token: localStorage only (opaque, used once then rotated).
 */

const ACCESS_KEY = 'heimdal_at';
const REFRESH_KEY = 'heimdal_rt';

export const tokenStore = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },

  setAccessToken(accessToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
  },

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },

  hasTokens(): boolean {
    return !!localStorage.getItem(ACCESS_KEY);
  },
};
