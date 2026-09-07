import Phaser from 'phaser';
import type { LevelConfig } from '../systems/WaveManager';
import { Pathfinder, center, TILE } from '../systems/Pathfinder';
import type { Cell } from '../systems/Pathfinder';

export class Enemy extends Phaser.GameObjects.Container {
  hp: number;
  maxHp: number;
  speed: number;
  attackDamage: number;
  cloneRange = 0;
  cloneInterval = 1;
  rangedCooldown = 0;
  private path: Cell[] = [];
  private pathVersion = -1;
  private target: Cell | undefined;
  private readonly bar: Phaser.GameObjects.Rectangle;
  readonly radius: number;
  alive = true;
  slowTime = 0;

  constructor(scene: Phaser.Scene, readonly level: LevelConfig, private readonly grid: Pathfinder, multiplier: number, readonly boss = false) {
    const position = center(grid.start);
    super(scene, position.x, position.y);
    this.maxHp = level.hp * multiplier * (boss ? 10 : 1);
    this.hp = this.maxHp;
    this.speed = boss ? 30 : level.speed;
    this.attackDamage = boss ? 50 : level.gateDamage;
    this.radius = boss ? 25 : level.radius;
    const shape = scene.add.circle(0, 0, this.radius, Phaser.Display.Color.HexStringToColor(level.color).color).setStrokeStyle(boss ? 4 : 2, 0xefe1c8);
    const mark = scene.add.text(0, 0, boss ? '♛' : '◆', { fontSize: boss ? '24px' : '14px', color: '#181319' }).setOrigin(0.5);
    this.bar = scene.add.rectangle(-this.radius, -this.radius - 8, this.radius * 2, 4, 0xef7952).setOrigin(0, 0.5);
    this.add([shape, mark, this.bar]);
    scene.add.existing(this);
    this.setDepth(5);
  }

  get cell(): Cell { return { col: Math.max(0, Math.min(17, Math.floor(this.x / TILE))), row: Math.max(0, Math.min(9, Math.floor(this.y / TILE))) }; }
  get occupiedCells(): Cell[] { return this.target ? [this.cell, this.target] : [this.cell]; }

  step(delta: number): boolean {
    this.slowTime = Math.max(0, this.slowTime - delta);
    const movement = this.speed * delta * (this.slowTime > 0 ? 0.5 : 1);
    if (this.pathVersion !== this.grid.version) {
      this.path = this.grid.find(this.cell);
      this.pathVersion = this.grid.version;
      this.target = this.path.shift();
    }
    if (!this.target) return true;
    const dest = center(this.target);
    const distance = Phaser.Math.Distance.Between(this.x, this.y, dest.x, dest.y);
    if (distance <= movement) {
      this.setPosition(dest.x, dest.y);
      this.target = this.path.shift();
      return !this.target;
    }
    this.x += (dest.x - this.x) / distance * movement;
    this.y += (dest.y - this.y) / distance * movement;
    return false;
  }

  damage(amount: number, execute: boolean): number {
    if (!this.alive) return 0;
    const before = this.hp;
    this.hp = Math.max(0, this.hp - amount);
    if (execute && this.hp < this.maxHp * 0.1) this.hp = 0;
    if (this.level.id === 'colere') this.speed = Math.min(190, this.speed * 1.14);
    this.refreshBar();
    return before - this.hp;
  }

  heal(amount: number): void { if (this.alive) { this.hp = Math.min(this.maxHp, this.hp + amount); this.refreshBar(); } }
  private refreshBar(): void { this.bar.width = this.radius * 2 * this.hp / this.maxHp; }
}
