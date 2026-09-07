import type { TowerKind } from '../entities/Tower';

export interface ControlActions {
  launch: () => void; pause: () => void; menu: () => void;
  build: (kind: TowerKind) => void; upgrade: () => void; collect: () => void;
}
export class GameControls {
  readonly element = document.createElement('section');
  private readonly abort = new AbortController();
  constructor(actions: ControlActions) {
    this.element.className = 'game-ui';
    this.element.innerHTML = `<header class="game-header"><strong class="font-serif text-2xl">HELLGATE<span class="text-orange-400">·</span>TD</strong><span id="circle-name"></span><button data-action="pause" class="small-button">Pause</button><button data-action="menu" class="small-button">Quitter</button></header>
      <aside class="game-sidebar"><p class="eyebrow">Arsenal</p><h2 class="font-serif text-3xl">Défendre la Porte</h2>
      <button data-kind="ember" class="tower-button"><strong>Brasier</strong><span>100 cendres · tir direct</span></button>
      <button data-kind="frost" id="frost-build" class="tower-button" disabled><strong>Givre</strong><span>125 cendres · ralentissement</span></button>
      <div class="selection-panel"><p id="tower-info">Cliquez sur une tour ou choisissez une défense.</p><button data-action="upgrade" id="upgrade" class="small-button" disabled>Améliorer</button></div>
      <button data-action="collect" class="small-button">Récolter les cendres [R]</button><p class="text-sm leading-relaxed text-stone-400">Choisissez une tour, puis une case libre. Le chemin vers la Porte doit rester ouvert.</p></aside>
      <footer class="game-footer"><div><p id="wave-label" class="eyebrow"></p><p id="game-message" role="status" class="text-sm text-stone-300"></p></div><button data-action="launch" id="launch" class="primary-button">Lancer la vague</button></footer>`;
    document.querySelector('#ui-root')!.append(this.element);
    this.element.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!button || button.disabled) return;
      if (button.dataset.kind) actions.build(button.dataset.kind as TowerKind);
      else { const action = button.dataset.action as keyof Omit<ControlActions, 'build'>; actions[action]?.(); }
    }, { signal: this.abort.signal });
  }
  text(id: string, text: string): void { this.element.querySelector(`#${id}`)!.textContent = text; }
  disabled(id: string, disabled: boolean): void { (this.element.querySelector(`#${id}`) as HTMLButtonElement).disabled = disabled; }
  destroy(): void { this.abort.abort(); this.element.remove(); }
}
