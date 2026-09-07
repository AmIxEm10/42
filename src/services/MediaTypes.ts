import prompts from '../config/media-prompts.json';

export type CircleId = keyof typeof prompts.circles;
export type TarotId = keyof typeof prompts.tarots;
export type MediaRequest = { kind: 'circle'; id: CircleId } | { kind: 'tarot'; id: TarotId };
export interface MediaAsset {
  kind: 'image' | 'video';
  url: string;
  expiresAt: number;
}
export type MediaResult =
  | { source: 'higgsfield'; asset: MediaAsset }
  | { source: 'fallback'; asset: null; reason: string };

export function isMediaRequest(value: unknown): value is MediaRequest {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== 'string' || Object.keys(item).some(key => key !== 'kind' && key !== 'id')) return false;
  return (item.kind === 'circle' && Object.hasOwn(prompts.circles, item.id)) ||
    (item.kind === 'tarot' && Object.hasOwn(prompts.tarots, item.id));
}

export function isMediaAsset(value: unknown): value is MediaAsset {
  if (!value || typeof value !== 'object') return false;
  const asset = value as Record<string, unknown>;
  if ((asset.kind !== 'image' && asset.kind !== 'video') || typeof asset.url !== 'string' ||
    typeof asset.expiresAt !== 'number' || !Number.isFinite(asset.expiresAt)) return false;
  try {
    const url = new URL(asset.url);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}
