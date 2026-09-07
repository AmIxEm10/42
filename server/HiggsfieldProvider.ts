import { setTimeout as sleep } from 'node:timers/promises';
import { ProviderError } from './ProviderError';

const ORIGIN = 'https://api.higgsfield.ai';
const TERMINAL_FAILURES = new Set(['failed', 'nsfw', 'canceled']);
interface ProviderOptions {
  apiKey: string;
  apiSecret: string;
  fetcher?: typeof fetch;
  wait?: (ms: number) => Promise<void>;
  pollIntervalMs?: number;
  timeoutMs?: number;
}
type Payload = Record<string, unknown>;

/** Serveur uniquement : aucune dépendance importée par le navigateur. */
export class HiggsfieldProvider {
  private readonly fetcher: typeof fetch;
  private readonly wait: (ms: number) => Promise<void>;
  constructor(private readonly options: ProviderOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.wait = options.wait ?? (ms => sleep(ms));
  }

  async generate(endpoint: string, input: Payload, kind: 'image' | 'video'): Promise<string> {
    if (!this.options.apiKey || !this.options.apiSecret) throw new ProviderError('NOT_CONFIGURED', 503);
    const deadline = Date.now() + (this.options.timeoutMs ?? 600_000);
    // Ne jamais retenter un POST : une réponse perdue peut déjà avoir débité des crédits.
    let result = await this.request(`${ORIGIN}${endpoint}`, 'POST', input, deadline);
    if (typeof result.request_id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(result.request_id)) {
      throw new ProviderError('INVALID_PROVIDER_RESPONSE');
    }
    const requestId = result.request_id;
    let statusUrl: string | undefined;
    if (result.status !== 'completed' && !TERMINAL_FAILURES.has(String(result.status))) {
      statusUrl = this.validateStatusUrl(result.status_url, requestId);
    }
    let delay = this.options.pollIntervalMs ?? 2000;
    while (true) {
      if (result.status === 'completed') return this.outputUrl(result, kind);
      if (TERMINAL_FAILURES.has(String(result.status))) throw new ProviderError(`GENERATION_${String(result.status).toUpperCase()}`, 422);
      if (result.status !== 'queued' && result.status !== 'in_progress') throw new ProviderError('INVALID_PROVIDER_RESPONSE');
      if (Date.now() + delay >= deadline) throw new ProviderError('GENERATION_TIMEOUT', 504);
      await this.wait(delay);
      let retryFloor = 0;
      try {
        const next = await this.request(statusUrl!, 'GET', undefined, deadline);
        if (next.request_id !== requestId) throw new ProviderError('INVALID_PROVIDER_RESPONSE');
        result = next;
      } catch (error) {
        if (!(error instanceof ProviderError) || !['UPSTREAM_TEMPORARY', 'UPSTREAM_NETWORK', 'UPSTREAM_RATE_LIMIT'].includes(error.code)) throw error;
        retryFloor = error.retryAfterMs;
      }
      delay = Math.max(Math.min(delay * 1.5, 10_000), retryFloor);
    }
  }

  private validateStatusUrl(value: unknown, id: string): string {
    if (typeof value !== 'string') throw new ProviderError('INVALID_PROVIDER_RESPONSE');
    let url: URL;
    try { url = new URL(value); } catch { throw new ProviderError('INVALID_PROVIDER_RESPONSE'); }
    if (url.origin !== ORIGIN || url.username || url.password || url.pathname !== `/requests/${id}/status` || url.search || url.hash) {
      throw new ProviderError('UNTRUSTED_STATUS_URL');
    }
    return url.href;
  }

  private outputUrl(result: Payload, kind: 'image' | 'video'): string {
    const item = kind === 'image' && Array.isArray(result.images) ? result.images[0] : result.video;
    if (!item || typeof item !== 'object' || typeof item.url !== 'string') throw new ProviderError('INVALID_PROVIDER_RESPONSE');
    let url: URL;
    try { url = new URL(item.url); } catch { throw new ProviderError('INVALID_PROVIDER_RESPONSE'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new ProviderError('INVALID_PROVIDER_RESPONSE');
    return url.href;
  }

  private async request(url: string, method: 'POST' | 'GET', body: Payload | undefined, deadline: number): Promise<Payload> {
    let response: Response;
    try {
      response = await this.fetcher(url, {
        method,
        redirect: 'error',
        headers: { Authorization: `Key ${this.options.apiKey}:${this.options.apiSecret}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(Math.max(1, Math.min(30_000, deadline - Date.now()))),
      });
    } catch { throw new ProviderError('UPSTREAM_NETWORK'); }
    if (!response.ok) {
      if (response.status === 429) {
        const raw = response.headers.get('retry-after');
        const seconds = Number(raw);
        const delay = raw && Number.isFinite(seconds) ? seconds * 1000 : raw ? Date.parse(raw) - Date.now() : 2000;
        throw new ProviderError('UPSTREAM_RATE_LIMIT', 429, Number.isFinite(delay) ? Math.max(2000, delay) : 2000);
      }
      if (response.status >= 500) throw new ProviderError('UPSTREAM_TEMPORARY');
      if (response.status === 401 || response.status === 403) throw new ProviderError('UPSTREAM_AUTH', 503);
      if (response.status === 402) throw new ProviderError('UPSTREAM_CREDITS', 503);
      throw new ProviderError('UPSTREAM_REJECTED', 422);
    }
    try {
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
      return data as Payload;
    } catch { throw new ProviderError('INVALID_PROVIDER_RESPONSE'); }
  }
}
