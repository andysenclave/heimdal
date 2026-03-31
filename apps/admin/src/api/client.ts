import ky from 'ky';
import { tokenStore } from './token-store';

let isRefreshing = false;

export const api = ky.create({
  prefixUrl: '/api/v1',
  timeout: 30000,
  // Don't retry on 401 — we handle that in afterResponse
  retry: { limit: 2, methods: ['get'], statusCodes: [408, 429, 500, 502, 503, 504] },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = tokenStore.getAccessToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401 && !isRefreshing) {
          const refreshToken = tokenStore.getRefreshToken();
          if (!refreshToken) return response;

          isRefreshing = true;
          try {
            const refreshed = await ky
              .post(`${request.url.split('/api/v1')[0]}/api/v1/auth/refresh`, {
                json: { refreshToken },
                timeout: 10000,
              })
              .json<{ accessToken: string; refreshToken: string }>();

            tokenStore.setTokens(refreshed.accessToken, refreshed.refreshToken);

            // Retry original request with new token
            const retryRequest = request.clone();
            retryRequest.headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
            return ky(retryRequest, options);
          } catch {
            tokenStore.clear();
            window.location.href = '/login';
          } finally {
            isRefreshing = false;
          }
        }
        return response;
      },
    ],
  },
});
