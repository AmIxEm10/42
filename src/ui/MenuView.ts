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

  mount(): void {
    this.panel.innerHTML = `
      <p class="text-sm uppercase tracking-[0.3em] text-orange-300">Les sept cercles</p>
      <h1 class="break-words font-serif text-5xl tracking-tight sm:text-8xl">HELLGATE<span class="text-orange-500">·</span>TD</h1>
      <p class="max-w-md text-lg leading-relaxed text-stone-300">Défendez la Porte des Enfers.<br>Les âmes damnées ne doivent pas s'échapper.</p>
      <div class="h-px w-24 bg-orange-500/60"></div>
      <button type="button" disabled aria-describedby="build-status" class="border border-stone-600 px-10 py-4 text-base text-stone-400">Entrer dans les Enfers</button>
      <p id="build-status" class="max-w-sm text-sm leading-relaxed text-stone-400">Version 0.1 — Socle technique.<br>La première vague arrive à la prochaine étape de développement.</p>
    `;
    this.root.append(this.panel);
  }

  destroy(): void { this.panel.remove(); }
}
