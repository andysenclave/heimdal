/**
 * Extract a user-friendly error message from any error shape,
 * including NestJS HTTPError responses from ky.
 */
export async function extractApiError(err: unknown, fallback = 'An error occurred'): Promise<string> {
  if (!err || typeof err !== 'object') return fallback;
  if ('response' in err) {
    try {
      const body = await (err as { response: Response }).response.json() as {
        message?: string | string[];
        error?: string;
      };
      const raw = Array.isArray(body.message) ? body.message[0] : body.message;
      return raw ?? body.error ?? fallback;
    } catch {
      return fallback;
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
