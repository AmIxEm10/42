import type { IncomingMessage, ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { isMediaRequest } from '../src/services/MediaTypes';
import { MediaService } from './MediaService';
import { ProviderError } from './ProviderError';

function authorized(actual: string | undefined, token: string): boolean {
  const expected = Buffer.from(`Bearer ${token}`);
  const received = Buffer.from(actual ?? '');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function createMediaHandler(service: MediaService, token: string) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const reply = (status: number, body: unknown): void => {
      if (res.destroyed) return;
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(body));
    };
    if (req.url !== '/api/media') return reply(404, { code: 'NOT_FOUND' });
    if (!token || !authorized(req.headers.authorization, token)) return reply(401, { code: 'UNAUTHORIZED' });
    if (req.method !== 'POST') return reply(405, { code: 'METHOD_NOT_ALLOWED' });
    if (req.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') return reply(415, { code: 'JSON_REQUIRED' });
    try {
      let body = '';
      let size = 0;
      for await (const chunk of req) {
        size += Buffer.byteLength(chunk);
        if (size > 1024) return reply(413, { code: 'BODY_TOO_LARGE' });
        body += chunk.toString();
      }
      let request: unknown;
      try { request = JSON.parse(body); } catch { return reply(400, { code: 'INVALID_JSON' }); }
      if (!isMediaRequest(request)) return reply(400, { code: 'INVALID_REQUEST' });
      reply(200, await service.get(request));
    } catch (error) {
      const safe = error instanceof ProviderError ? error : new ProviderError('MEDIA_UNAVAILABLE');
      reply(safe.httpStatus, { code: safe.code });
    }
  };
}
