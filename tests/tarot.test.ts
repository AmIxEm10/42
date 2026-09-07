import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TarotDeck, CARDS } from '../src/systems/TarotDeck';
import { TarotManager } from '../src/systems/TarotManager';

test('tirage de trois cartes uniques et exclusion des pouvoirs déjà acquis', () => {
  const deck = new TarotDeck(false, () => 0.5);
  const cards = deck.draw(['la-mort', 'givre']);
  assert.equal(cards.length, 3); assert.equal(new Set(cards.map(card => card.id)).size, 3);
  assert.equal(cards.some(card => ['la-mort', 'givre', 'jugement'].includes(card.id)), false);
});

test('les trois arcanes principaux appliquent leur effet une seule fois par offre', () => {
  let damage = 1, hp = 100, execution = false, aoe = false;
  for (const id of ['le-diable', 'la-mort', 'la-tour'] as const) {
    const deck = new TarotDeck(false); deck.draw = () => CARDS.filter(card => card.id === id);
    const manager = new TarotManager(deck, { multiplyDamage: f => { damage *= f; }, curseGate: () => { hp *= .9; }, enableExecution: () => { execution = true; }, targetAoe: () => { aoe = true; }, unlockFrost: () => {}, addAshes: () => {} });
    manager.draw(); assert.equal(manager.choose(id), true); assert.equal(manager.choose(id), false);
  }
  assert.equal(damage, 2); assert.equal(hp, 90); assert.equal(execution, true); assert.equal(aoe, true);
});
