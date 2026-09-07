import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { Pathfinder, TILE, cellKey } from '../systems/Pathfinder';
import { WaveManager } from '../systems/WaveManager';
import { Spawner } from '../systems/Spawner';
import { CombatSystem } from '../systems/CombatSystem';
import { EconomyManager } from '../systems/EconomyManager';
import { Enemy } from '../entities/Enemy';
import { Tower } from '../entities/Tower';
import type { TowerKind } from '../entities/Tower';
import { Gate } from '../entities/Gate';
import { AshDrop } from '../entities/AshDrop';
import { BoardRenderer } from '../ui/BoardRenderer';
import { GameControls } from '../ui/GameControls';
import { MetaStore } from '../state/MetaStore';

export class Game extends Phaser.Scene {
  grid!: Pathfinder;
  waves!: WaveManager;
  economy!: EconomyManager;
  combat!: CombatSystem;
  gate!: Gate;
  controls!: GameControls;
  selected: Tower | null = null;
  frostUnlocked = false;
  paused = false;
  drawing = false;
  awaitingAoe = false;
  private spawner!: Spawner;
  private board!: BoardRenderer;
  private enemies: Enemy[] = [];
  private drops: AshDrop[] = [];
  private buildKind: TowerKind | null = null;
  private bossClock = 0;
  private uiClock = 0;
  private ended = false;

  constructor() { super(SceneKeys.Game); }

  create(): void {
    this.grid = new Pathfinder(); this.waves = new WaveManager(); this.economy = new EconomyManager();
    this.spawner = new Spawner(); this.combat = new CombatSystem(this, enemy => this.kill(enemy));
    this.enemies = []; this.drops = []; this.selected = null; this.buildKind = null;
    this.paused = false; this.drawing = false; this.awaitingAoe = false; this.frostUnlocked = false; this.ended = false;
    this.bossClock = 0; this.uiClock = 0;
    document.querySelector('#app')!.classList.add('playing');
    this.controls = new GameControls({
      launch: () => this.launch(), pause: () => { this.paused = !this.paused; this.message(this.paused ? 'Partie en pause.' : 'Partie reprise.'); },
      menu: () => { this.scene.start(SceneKeys.MainMenu); }, build: kind => this.chooseBuild(kind),
      upgrade: () => this.upgrade(), collect: () => this.collectAll(),
    });
    this.board = new BoardRenderer(this, this.grid);
    this.gate = new Gate(this, this.grid.goal, MetaStore.shared.gateLevel * 20);
    this.scale.refresh(); this.resize();
    this.scale.on('resize', this.resize, this);
    this.input.on('pointerdown', this.pointer, this);
    this.input.keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => { if (event.target === document.body || event.target instanceof HTMLCanvasElement) { event.preventDefault(); this.launch(); } });
    this.input.keyboard?.on('keydown-R', () => this.collectAll());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy(); this.scale.off('resize', this.resize, this);
      document.querySelector('#app')!.classList.remove('playing'); this.scale.refresh();
    });
    this.beginPreparation(); this.refresh();
  }

  private resize(): void {
    this.cameras.main.setZoom(Math.min(this.scale.width / 900, this.scale.height / 520)).centerOn(432, 240);
  }

  beginPreparation(): void { this.message('Placez vos défenses, puis lancez la vague.'); }
  message(text: string): void { this.controls.text('game-message', text); }

  private chooseBuild(kind: TowerKind): void {
    if (this.paused || this.drawing || (kind === 'frost' && !this.frostUnlocked)) return;
    this.buildKind = kind; this.selected = null;
    this.message(`Placement : ${kind === 'ember' ? 'Brasier' : 'Givre'}. Cliquez sur une case libre.`); this.refresh();
  }

  private pointer(pointer: Phaser.Input.Pointer): void {
    if (this.paused || this.drawing || this.ended) return;
    const point = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    const drop = this.drops.find(item => Phaser.Math.Distance.Between(point.x, point.y, item.x, item.y) < 18);
    if (drop) { this.collect(drop); return; }
    const cell = { col: Math.floor(point.x / TILE), row: Math.floor(point.y / TILE) };
    const tower = this.combat.towers.find(item => cellKey(item.cell) === cellKey(cell));
    if (tower) {
      this.selected = tower; this.buildKind = null;
      if (this.awaitingAoe) { tower.aoe = true; this.awaitingAoe = false; this.message('La Tour : cette défense inflige des dégâts de zone.'); }
      this.refresh(); return;
    }
    if (!this.buildKind) return;
    const occupied = this.enemies.filter(enemy => enemy.alive).flatMap(enemy => enemy.occupiedCells);
    if (!this.grid.canPlace(cell, occupied)) { this.message('Placement impossible : obstacle, ennemi ou passage bloqué.'); return; }
    if (!this.economy.spend(Tower.cost(this.buildKind))) { this.message('Pas assez de cendres.'); return; }
    const placed = new Tower(this, cell, this.buildKind);
    this.combat.towers.push(placed); this.grid.addTower(cell); this.selected = placed;
    if (this.awaitingAoe) { placed.aoe = true; this.awaitingAoe = false; }
    this.refresh();
  }

  private upgrade(): void {
    if (this.paused || this.drawing || !this.selected || this.selected.level >= 5) return;
    if (!this.economy.spend(this.selected.upgradeCost)) { this.message('Pas assez de cendres.'); return; }
    this.selected.upgrade(); this.refresh();
  }

  launch(): void {
    if (this.waves.active || this.paused || this.drawing || this.awaitingAoe || this.ended) return;
    this.waves.start(); this.spawner.start(this.waves.count, this.waves.level.spawnInterval);
    this.message(this.waves.level.description); this.refresh();
  }

  update(_time: number, deltaMs: number): void {
    if (this.ended || !this.controls || this.paused || this.drawing) return;
    const delta = Math.min(deltaMs / 1000, 0.05);
    if (this.waves.active) {
      this.spawner.update(delta, last => this.enemies.push(new Enemy(this, this.waves.level, this.grid, this.waves.hpMultiplier, last && this.waves.hasBoss)));
      for (const enemy of this.enemies) {
        if (enemy.alive && enemy.step(delta)) { this.gate.damage(enemy.attackDamage); enemy.alive = false; enemy.destroy(); }
      }
      this.combat.update(delta, this.enemies, this.waves.level);
      this.enemies = this.enemies.filter(enemy => enemy.alive);
      this.bossClock += delta;
      if (this.bossClock > 5 && this.enemies.some(enemy => enemy.boss)) { this.bossClock = 0; this.moveBossWall(); }
      if (this.gate.hp <= 0) { this.end(false); return; }
      if (!this.enemies.length && this.spawner.remaining === 0) this.finishWave();
    }
    this.drops = this.drops.filter(drop => { if (drop.step(delta)) { drop.destroy(); return false; } return true; });
    this.uiClock += delta;
    if (this.uiClock >= 0.15) { this.uiClock = 0; this.refresh(); }
  }

  private kill(enemy: Enemy): void {
    this.economy.kills++;
    this.drops.push(new AshDrop(this, enemy.x, enemy.y, this.waves.level.reward * (enemy.boss ? 10 : 1), this.waves.level.id === 'avarice'));
    if (enemy.level.id === 'colere') {
      for (const tower of this.combat.towers) if (Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y) < 100) tower.stunned = 2;
      if (Phaser.Math.Distance.Between(this.gate.x, this.gate.y, enemy.x, enemy.y) < 100) this.gate.damage(5);
      const blast = this.add.circle(enemy.x, enemy.y, 100, 0xef5140, 0.16).setDepth(6);
      this.tweens.add({ targets: blast, alpha: 0, duration: 350, onComplete: () => blast.destroy() });
    }
    enemy.destroy();
  }

  collectAll(): void { if (this.paused || this.drawing) return; for (const drop of [...this.drops]) this.collect(drop); }
  private collect(drop: AshDrop): void {
    if (drop.remaining <= 0) return;
    this.economy.collect(drop.amount); this.drops = this.drops.filter(item => item !== drop); drop.destroy(); this.refresh();
  }

  private finishWave(): void {
    this.waves.finish();
    if (this.waves.level.id !== 'avarice') this.collectAll();
    this.grid.moveObstacle(null);
    if (this.waves.circleComplete) {
      MetaStore.shared.reward(3);
      if (!this.waves.nextCircle()) { MetaStore.shared.reward(10); this.end(true); return; }
      this.economy.collect(120); // Prime de passage vers le cercle suivant.
    }
    this.beginPreparation(); this.refresh();
  }

  private moveBossWall(): void {
    this.grid.moveObstacle(null);
    const occupied = this.enemies.flatMap(enemy => enemy.occupiedCells);
    const candidates = this.grid.find().filter(cell => this.grid.canPlace(cell, occupied));
    if (candidates.length) this.grid.moveObstacle(Phaser.Utils.Array.GetRandom(candidates));
    this.message('Orgueil déplace les murs : le chemin est recalculé.');
  }

  private end(victory: boolean): void {
    this.ended = true;
    this.scene.start(SceneKeys.MetaProgression, { victory, kills: this.economy.kills });
  }

  refresh(): void {
    this.controls.text('circle-name', `${this.waves.levelIndex + 1} / 7 · ${this.waves.level.name}`);
    this.controls.text('wave-label', `Vague ${this.waves.wave} / ${this.waves.level.waves} · Porte ${Math.ceil(this.gate.hp)} / ${Math.ceil(this.gate.maxHp)} · ${Math.floor(this.economy.ashes)} cendres`);
    this.controls.disabled('launch', this.waves.active || this.drawing || this.awaitingAoe || this.paused);
    this.controls.disabled('frost-build', !this.frostUnlocked);
    this.controls.disabled('upgrade', !this.selected || this.selected.level >= 5 || this.economy.ashes < this.selected.upgradeCost);
    this.controls.text('tower-info', this.selected ? `${this.selected.kind === 'ember' ? 'Brasier' : 'Givre'} niv. ${this.selected.level} · ${Math.round(this.selected.damage * this.combat.multiplier)} dégâts${this.selected.aoe ? ' · Zone' : ''}` : 'Choisissez une défense, puis une case libre.');
    this.controls.text('upgrade', this.selected ? this.selected.level >= 5 ? 'Niveau maximal' : `Améliorer · ${this.selected.upgradeCost} cendres` : 'Améliorer');
    this.board.draw(this.waves.level, this.selected);
  }
}
