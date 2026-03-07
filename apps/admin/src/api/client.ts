import ky from 'ky';

export const api = ky.create({
  prefixUrl: '/api/v1',
  credentials: 'include',
  timeout: 30000,
  retry: { limit: 2, methods: ['get'] },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = document
          .querySelector('meta[name="csrf-token"]')
          ?.getAttribute('content');
        if (token) request.headers.set('X-CSRF-Token', token);
      },
    ],
  },
});
