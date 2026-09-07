import Phaser from 'phaser';
import { center } from '../systems/Pathfinder';
import type { Cell } from '../systems/Pathfinder';

export type TowerKind = 'ember' | 'frost';
export class Tower extends Phaser.GameObjects.Container {
  level = 1;
  aoe = false;
  stunned = 0;
  cooldown = 0;
  private readonly label: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, readonly cell: Cell, readonly kind: TowerKind) {
    const point = center(cell);
    super(scene, point.x, point.y);
    const color = kind === 'ember' ? 0xe88440 : 0x84cbdc;
    this.add(scene.add.rectangle(0, 0, 29, 29, 0x25222a).setStrokeStyle(3, color));
    this.label = scene.add.text(0, 0, kind === 'ember' ? 'I' : '❄', { fontSize: '20px', color: kind === 'ember' ? '#ffb56c' : '#9fdae6' }).setOrigin(0.5);
    this.add(this.label); scene.add.existing(this); this.setDepth(4);
  }
  static cost(kind: TowerKind): number { return kind === 'ember' ? 100 : 125; }
  get damage(): number { return (this.kind === 'ember' ? 42 : 22) * (1 + (this.level - 1) * 0.55); }
  get range(): number { return (this.kind === 'ember' ? 150 : 135) + (this.level - 1) * 12; }
  get interval(): number { return (this.kind === 'ember' ? 0.75 : 0.9) / (1 + (this.level - 1) * 0.12); }
  get upgradeCost(): number { return 70 * this.level; }
  upgrade(): void { if (this.level < 5) { this.level++; this.label.setText(this.kind === 'ember' ? ['I', 'II', 'III', 'IV', 'V'][this.level - 1]! : `❄${this.level}`); } }
}
