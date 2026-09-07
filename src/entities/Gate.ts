import Phaser from 'phaser';
import { center } from '../systems/Pathfinder';
import type { Cell } from '../systems/Pathfinder';

export class Gate extends Phaser.GameObjects.Container {
  hp: number;
  maxHp: number;
  constructor(scene: Phaser.Scene, cell: Cell, bonus: number) {
    const point = center(cell);
    super(scene, point.x, point.y);
    this.maxHp = 100 + bonus; this.hp = this.maxHp;
    this.add(scene.add.rectangle(0, 0, 36, 40, 0xa64230).setStrokeStyle(3, 0xffcd91));
    this.add(scene.add.text(0, 0, 'Ω', { fontSize: '28px', color: '#ffdeb2' }).setOrigin(0.5));
    scene.add.existing(this);
  }
  damage(amount: number): void { this.hp = Math.max(0, this.hp - amount); }
  curse(): void { this.maxHp = Math.max(1, this.maxHp * 0.9); this.hp = Math.min(this.hp, this.maxHp); }
}
