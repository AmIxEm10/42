import type { TarotCard, CardId } from '../systems/TarotDeck';
import { HiggsfieldAPI } from '../services/HiggsfieldAPI';

export class TarotOverlay {
  private dialog: HTMLDialogElement | null = null;
  private controller: AbortController | null = null;
  constructor(private readonly media: HiggsfieldAPI) {}

  show(cards: TarotCard[], onChoose: (id: CardId) => void): void {
    this.destroy();
    const dialog = document.createElement('dialog');
    dialog.className = 'tarot-dialog'; dialog.setAttribute('aria-labelledby', 'tarot-title');
    dialog.innerHTML = `<p class="eyebrow">Phase de tirage</p><h2 id="tarot-title" class="font-serif text-4xl">Choisissez votre destin.</h2><p class="text-stone-400">Trois arcanes. Un seul pacte pour cette vague.</p><div class="tarot-grid"></div>`;
    this.dialog = dialog; this.controller = new AbortController();
    const signal = this.controller.signal;
    const grid = dialog.querySelector('.tarot-grid')!;
    for (const card of cards) {
      const button = document.createElement('button'); button.className = 'tarot-card';
      button.innerHTML = `<div class="tarot-art"><span class="tarot-numeral">${card.numeral}</span></div><strong>${card.title}</strong><p>${card.description}</p><span class="card-choice">Choisir cet arcane</span>`;
      button.addEventListener('click', () => { this.destroy(); onChoose(card.id); }, { signal });
      grid.append(button);
      if (card.id === 'la-tour' || card.id === 'le-diable' || card.id === 'la-mort') {
        void this.media.getOrFallback({ kind: 'tarot', id: card.id }, signal).then(result => {
          if (signal.aborted || result.source !== 'higgsfield') return;
          const image = new Image(); image.alt = ''; image.referrerPolicy = 'no-referrer';
          image.onload = () => { if (!signal.aborted) button.querySelector('.tarot-art')!.prepend(image); };
          image.src = result.asset.url;
        }).catch(() => { /* Fermeture du tirage : ne pas interrompre le jeu. */ });
      }
    }
    dialog.addEventListener('cancel', event => event.preventDefault(), { signal });
    document.querySelector('#ui-root')!.append(dialog); dialog.showModal();
  }
  destroy(): void { this.controller?.abort(); this.dialog?.close(); this.dialog?.remove(); this.dialog = null; }
}
