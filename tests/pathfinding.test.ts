import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pathfinder, cellKey } from '../src/systems/Pathfinder';
import { WaveManager } from '../src/systems/WaveManager';

test('chemin continu vers la Porte et refus des placements bloquants', () => {
  const grid = new Pathfinder();
  const path = grid.find();
  assert.equal(cellKey(path[0]!), cellKey(grid.start));
  assert.equal(cellKey(path.at(-1)!), cellKey(grid.goal));
  for (let i = 1; i < path.length; i++) assert.equal(Math.abs(path[i]!.col - path[i-1]!.col) + Math.abs(path[i]!.row - path[i-1]!.row), 1);
  for (let row = 7; row < 9; row++) grid.addTower({ col: 4, row });
  assert.equal(grid.canPlace({ col: 4, row: 9 }), false);
  assert.equal(grid.canPlace(grid.start), false);
  assert.equal(grid.canPlace({ col: 1, row: 4 }, [{ col: 1, row: 4 }]), false);
});

test('sept cercles de trois vagues et boss final uniquement', () => {
  const waves = new WaveManager();
  for (let level = 0; level < 7; level++) {
    for (let wave = 1; wave <= 3; wave++) {
      waves.start(); assert.equal(waves.wave, wave);
      assert.equal(waves.hasBoss, level === 6 && wave === 3);
      waves.finish();
    }
    assert.equal(waves.circleComplete, true);
    assert.equal(waves.nextCircle(), level < 6);
  }
});
