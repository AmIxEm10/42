import prompts from '../src/config/media-prompts.json';
import type { MediaAsset, MediaRequest } from '../src/services/MediaTypes';
import { ProviderError } from './ProviderError';

interface Provider {
  generate(endpoint: string, input: Record<string, unknown>, kind: 'image' | 'video'): Promise<string>;
}

/** Cache mémoire borné par les dix identifiants du catalogue. */
export class MediaService {
  private readonly cache = new Map<string, MediaAsset>();
  private readonly pending = new Map<string, Promise<MediaAsset>>();
  private readonly failures = new Map<string, { until: number; error: ProviderError }>();
  private submissions = 0;

  constructor(private readonly provider: Provider, private readonly maxGenerations = 10) {}

  get(request: MediaRequest): Promise<MediaAsset> {
    const key = `${request.kind}:${request.id}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached);
    const existing = this.pending.get(key);
    if (existing) return existing;
    const failure = this.failures.get(key);
    if (failure && failure.until > Date.now()) return Promise.reject(failure.error);
    if (this.pending.size >= 2) return Promise.reject(new ProviderError('BUSY', 429));
    if (this.submissions >= this.maxGenerations) return Promise.reject(new ProviderError('SESSION_BUDGET_REACHED', 429));
    this.submissions++;
    const pending = this.create(request).then(asset => {
      this.cache.set(key, asset);
      return asset;
    }).catch((error: unknown) => {
      const safe = error instanceof ProviderError ? error : new ProviderError('MEDIA_UNAVAILABLE');
      // Un échec réseau peut masquer une soumission acceptée : éviter les relances immédiates.
      this.failures.set(key, { until: Date.now() + 600_000, error: safe });
      throw safe;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, pending);
    return pending;
  }

  private async create(request: MediaRequest): Promise<MediaAsset> {
    const video = request.kind === 'circle';
    const kind = video ? 'video' : 'image';
    const endpoint = video ? '/bytedance/seedance/v1/lite/text-to-video' : '/flux-pro/kontext/max/text-to-image';
    const input = request.kind === 'circle'
      ? { prompt: `${prompts.circles[request.id]} ${prompts.videoStyle}`, duration: 5, resolution: '720', aspect_ratio: '16:9', camera_fixed: true }
      : { prompt: `${prompts.tarots[request.id]} ${prompts.tarotStyle}`, aspect_ratio: '2:3', safety_tolerance: 2, seed: 42666 };
    const url = await this.provider.generate(endpoint, input, kind);
    return { kind, url, expiresAt: Date.now() + 6 * 60 * 60 * 1000 };
  }
}
