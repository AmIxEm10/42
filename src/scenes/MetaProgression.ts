import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { MetaStore } from '../state/MetaStore';

export class MetaProgression extends Phaser.Scene {
  constructor() { super(SceneKeys.MetaProgression); }
  create(data: { victory?: boolean; kills?: number }): void {
    const root = document.createElement('section');
    root.className = 'meta-screen pointer-events-auto';
    const meta = MetaStore.shared;
    const draw = (): void => {
      root.innerHTML = `<p class="eyebrow">La Porte se souvient</p><h1 class="font-serif text-5xl">${data.victory ? 'Les Enfers sont scellés.' : data.kills !== undefined ? 'La Porte est tombée.' : 'Héritage des gardiens'}</h1>
      <p class="text-stone-300">${meta.souls} Âmes Noires${data.kills !== undefined ? ` · ${data.kills} âmes repoussées` : ''}</p>
      <button data-action="gate" class="tower-button" ${meta.souls < meta.gateCost || meta.gateLevel >= 10 ? 'disabled' : ''}><strong>Porte renforcée · niveau ${meta.gateLevel}</strong><span>+20 PV permanents · ${meta.gateCost} Âmes Noires</span></button>
      <button data-action="arcane" class="tower-button" ${meta.arcane || meta.souls < 8 ? 'disabled' : ''}><strong>Arcane du Jugement</strong><span>${meta.arcane ? 'Débloqué' : 'Ajoute un Tarot au deck · 8 Âmes Noires'}</span></button>
      <button data-action="play" class="primary-button">Nouvelle défense</button><button data-action="menu" class="small-button">Retour au menu</button>`;
    };
    draw(); document.querySelector('#ui-root')!.append(root);
    root.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!button || button.disabled) return;
      if (button.dataset.action === 'gate') { meta.upgradeGate(); draw(); }
      if (button.dataset.action === 'arcane') { meta.unlockArcane(); draw(); }
      if (button.dataset.action === 'play') this.scene.start(SceneKeys.Game);
      if (button.dataset.action === 'menu') this.scene.start(SceneKeys.MainMenu);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => root.remove());
  }
}
