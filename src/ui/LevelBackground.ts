import { HiggsfieldAPI } from '../services/HiggsfieldAPI';
import type { CircleId } from '../services/MediaTypes';

export class LevelBackground {
  private controller: AbortController | null = null;
  private video: HTMLVideoElement | null = null;
  private current: CircleId | null = null;
  constructor(private readonly media: HiggsfieldAPI) {}
  setCircle(id: CircleId): void {
    if (this.current === id) return;
    this.destroy(); this.current = id;
    this.controller = new AbortController(); const signal = this.controller.signal;
    void this.media.getOrFallback({ kind: 'circle', id }, signal).then(result => {
      if (signal.aborted || result.source !== 'higgsfield') return;
      const video = document.createElement('video');
      video.className = 'level-video'; video.muted = true; video.loop = true; video.playsInline = true;
      video.setAttribute('aria-hidden', 'true'); video.src = result.asset.url;
      this.video = video; document.querySelector('#app')!.prepend(video);
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) void video.play().catch(() => {});
    }).catch(() => {});
  }
  destroy(): void {
    this.controller?.abort(); this.video?.pause(); this.video?.removeAttribute('src'); this.video?.load(); this.video?.remove(); this.video = null; this.current = null;
  }
}
