import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DamageTracker } from '../src/systems/DamageTracker';
import { EconomyManager } from '../src/systems/EconomyManager';

test('DPS réel : fenêtre glissante, dégâts cumulés et retour à zéro après le combat', () => {
  const tracker = new DamageTracker();
  tracker.record(60); tracker.advance(1); tracker.record(30);
  assert.equal(tracker.dps, 30); assert.equal(tracker.total, 90);
  tracker.advance(2); assert.equal(tracker.dps, 10);
  tracker.advance(1); assert.equal(tracker.dps, 0); assert.equal(tracker.total, 90);
});

test('dépenses insuffisantes refusées et récolte comptabilisée séparément du solde initial', () => {
  const economy = new EconomyManager();
  assert.equal(economy.spend(301), false); assert.equal(economy.ashes, 300);
  assert.equal(economy.spend(100), true); economy.collect(16);
  assert.equal(economy.ashes, 216); assert.equal(economy.collected, 16);
});
