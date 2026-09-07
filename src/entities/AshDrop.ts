import Phaser from 'phaser';
export class AshDrop extends Phaser.GameObjects.Container {
  remaining: number;
  constructor(scene: Phaser.Scene, x: number, y: number, readonly amount: number, expires: boolean) {
    super(scene, x, y);
    this.remaining = expires ? 3 : Infinity;
    this.add(scene.add.circle(0, 0, 10, 0xffcb69, 0.8));
    this.add(scene.add.text(0, 0, '+', { color: '#2a1c10', fontSize: '16px' }).setOrigin(0.5));
    scene.add.existing(this); this.setDepth(9);
  }
  step(delta: number): boolean { this.remaining -= delta; if (this.remaining < 1) this.setAlpha(0.45 + this.remaining * 0.5); return this.remaining <= 0; }
}
