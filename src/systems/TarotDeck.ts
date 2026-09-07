export type CardId = 'la-tour' | 'le-diable' | 'la-mort' | 'givre' | 'cendres' | 'jugement';
export interface TarotCard { id: CardId; title: string; numeral: string; description: string }
export const CARDS: TarotCard[] = [
  { id: 'la-tour', title: 'La Tour', numeral: 'XVI', description: 'Une tour cible inflige des dégâts de zone dans un rayon de 70.' },
  { id: 'le-diable', title: 'Le Diable', numeral: 'XV', description: 'Double les dégâts de toutes les tours. La Porte perd 10 % de ses PV maximum.' },
  { id: 'la-mort', title: 'La Mort', numeral: 'XIII', description: 'Les attaques exécutent les ennemis qui passent sous 10 % de leurs PV.' },
  { id: 'givre', title: 'Le Pendu', numeral: 'XII', description: 'Débloque la tour Givre. Ses tirs ralentissent les ennemis.' },
  { id: 'cendres', title: 'La Roue', numeral: 'X', description: 'Accorde immédiatement 150 cendres pour vos défenses.' },
  { id: 'jugement', title: 'Le Jugement', numeral: 'XX', description: 'Augmente les dégâts globaux de 25 %, sans sacrifice.' },
];

export class TarotDeck {
  private readonly deck: TarotCard[];
  constructor(unlocked: boolean, private readonly random: () => number = Math.random) { this.deck = CARDS.filter(card => card.id !== 'jugement' || unlocked); }
  draw(excluded: CardId[] = []): TarotCard[] {
    const pool = this.deck.filter(card => !excluded.includes(card.id));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [pool[i], pool[j]] = [pool[j]!, pool[i]!]; }
    return pool.slice(0, 3);
  }
}
