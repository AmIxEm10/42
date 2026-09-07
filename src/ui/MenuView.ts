export class MenuView {
  private readonly root: HTMLElement;
  private readonly panel: HTMLElement;

  constructor() {
    const root = document.querySelector<HTMLElement>('#ui-root');
    if (!root) throw new Error('Conteneur UI introuvable.');
    this.root = root;
    this.panel = document.createElement('section');
    this.panel.className = 'pointer-events-auto flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-12 text-center';
  }

  mount(onPlay: () => void, onMeta: () => void): void {
    this.panel.innerHTML = `
      <p class="text-sm uppercase tracking-[0.3em] text-orange-300">Les sept cercles</p>
      <h1 class="break-words font-serif text-5xl tracking-tight sm:text-8xl">HELLGATE<span class="text-orange-500">·</span>TD</h1>
      <p class="max-w-md text-lg leading-relaxed text-stone-300">Défendez la Porte des Enfers.<br>Les âmes damnées ne doivent pas s'échapper.</p>
      <div class="h-px w-24 bg-orange-500/60"></div>
      <button type="button" data-play class="primary-button">Entrer dans les Enfers</button>
      <button type="button" data-meta class="small-button">Héritage des gardiens</button>
      <p class="max-w-sm text-sm leading-relaxed text-stone-400">7 cercles · 21 vagues · Une Porte à défendre</p>
    `;
    this.root.append(this.panel);
    this.panel.querySelector('[data-play]')!.addEventListener('click', onPlay);
    this.panel.querySelector('[data-meta]')!.addEventListener('click', onMeta);
  }

  destroy(): void { this.panel.remove(); }
}
