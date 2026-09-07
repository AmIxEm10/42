import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Projectile extends Phaser.GameObjects.Arc {
  private life = 3;
  constructor(scene: Phaser.Scene, x: number, y: number, readonly target: Enemy, readonly damage: number, readonly aoe: boolean, readonly frost: boolean) {
    super(scene, x, y, frost ? 5 : 4, 0, 360, false, frost ? 0xa3e3f3 : 0xffbd70);
    scene.add.existing(this); this.setDepth(7);
  }
  step(delta: number, hit: (enemy: Enemy, projectile: Projectile) => void): boolean {
    this.life -= delta;
    if (!this.target.alive || this.life <= 0) return true;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    const travel = 460 * delta;
    // Test balayé sur le trajet vers la cible : pas de traversée à grande vitesse.
    if (distance <= travel + this.target.radius) { hit(this.target, this); return true; }
    this.x += (this.target.x - this.x) / distance * travel;
    this.y += (this.target.y - this.y) / distance * travel;
    return false;
  }
}
