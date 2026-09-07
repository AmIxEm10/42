import { TarotDeck } from './TarotDeck';
import type { CardId, TarotCard } from './TarotDeck';

interface Target {
  multiplyDamage: (factor: number) => void; curseGate: () => void;
  enableExecution: () => void; unlockFrost: () => void; addAshes: (amount: number) => void; targetAoe: () => void;
}
export class TarotManager {
  private readonly acquired = new Set<CardId>();
  private offer: TarotCard[] = [];
  constructor(private readonly deck: TarotDeck, private readonly target: Target) {}
  draw(): TarotCard[] {
    this.offer = this.deck.draw([...this.acquired].filter(id => id === 'la-mort' || id === 'givre'));
    return [...this.offer];
  }
  choose(id: CardId): boolean {
    if (!this.offer.some(card => card.id === id)) return false;
    this.offer = [];
    this.acquired.add(id);
    switch (id) {
      case 'la-tour': this.target.targetAoe(); break;
      case 'le-diable': this.target.multiplyDamage(2); this.target.curseGate(); break;
      case 'la-mort': this.target.enableExecution(); break;
      case 'givre': this.target.unlockFrost(); break;
      case 'cendres': this.target.addAshes(150); break;
      case 'jugement': this.target.multiplyDamage(1.25); break;
    }
    return true;
  }
}
