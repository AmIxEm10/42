import { isMediaAsset, isMediaRequest } from './MediaTypes';
import type { CircleId, TarotId, MediaRequest, MediaAsset, MediaResult } from './MediaTypes';

interface Options {
  baseUrl?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  /** Jeton applicatif fourni à l'exécution, jamais une clé Higgsfield. */
  getAccessToken?: () => string | undefined;
}

export class MediaError extends Error {
  constructor(public readonly code: string, public readonly status = 0) {
    super(`Média indisponible (${code}).`);
    this.name = 'MediaError';
  }
}

/** Connecteur navigateur. Les erreurs restent explicites ; le repli est opt-in. */
export class HiggsfieldAPI {
  private readonly cache = new Map<string, MediaAsset>();
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;
  private readonly getAccessToken?: Options['getAccessToken'];

  constructor(options: Options = {}) {
    this.baseUrl = options.baseUrl ?? import.meta.env?.VITE_MEDIA_API_BASE_URL ?? '/api/media';
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 660_000;
    this.getAccessToken = options.getAccessToken;
  }

  getLevelBackground(id: CircleId, signal?: AbortSignal): Promise<MediaAsset> {
    return this.generate({ kind: 'circle', id }, signal);
  }

  getTarotArtwork(id: TarotId, signal?: AbortSignal): Promise<MediaAsset> {
    return this.generate({ kind: 'tarot', id }, signal);
  }

  async generate(request: MediaRequest, signal?: AbortSignal): Promise<MediaAsset> {
    if (!isMediaRequest(request)) throw new MediaError('INVALID_REQUEST', 400);
    signal?.throwIfAborted();
    const key = `${request.kind}:${request.id}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached;
    const timeout = AbortSignal.timeout(this.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const token = this.getAccessToken?.();
    let response: Response;
    try {
      response = await this.fetcher(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(request),
        signal: combined,
      });
    } catch {
      if (signal?.aborted) throw signal.reason;
      throw new MediaError(timeout.aborted ? 'TIMEOUT' : 'NETWORK');
    }
    let data: unknown;
    try { data = await response.json(); } catch {
      if (signal?.aborted) throw signal.reason;
      throw new MediaError(timeout.aborted ? 'TIMEOUT' : 'INVALID_RESPONSE', response.status);
    }
    if (!response.ok) {
      const code = data && typeof data === 'object' && 'code' in data && typeof data.code === 'string'
        ? data.code : 'HTTP_ERROR';
      throw new MediaError(code, response.status);
    }
    if (!isMediaAsset(data) || data.expiresAt <= Date.now() || data.kind !== (request.kind === 'circle' ? 'video' : 'image')) {
      throw new MediaError('INVALID_RESPONSE');
    }
    this.cache.set(key, data);
    return data;
  }

  /** L'UI conserve son fond/cadre local si l'IA est indisponible. */
  async getOrFallback(request: MediaRequest, signal?: AbortSignal): Promise<MediaResult> {
    try { return { source: 'higgsfield', asset: await this.generate(request, signal) }; }
    catch (error) {
      if (signal?.aborted) throw signal.reason;
      if (!(error instanceof MediaError)) throw error;
      return { source: 'fallback', asset: null, reason: error.code };
    }
  }
}
