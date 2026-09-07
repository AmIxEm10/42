import Phaser from 'phaser';
import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import type { LevelConfig } from './WaveManager';
import { center } from './Pathfinder';
import { DamageTracker } from './DamageTracker';

export class CombatSystem {
  readonly towers: Tower[] = [];
  private projectiles: Projectile[] = [];
  multiplier = 1;
  execute = false;
  private effectsClock = 0;
  readonly damageTracker = new DamageTracker();
  constructor(private readonly scene: Phaser.Scene, private readonly onKill: (enemy: Enemy) => void) {}
  get dps(): number { return this.damageTracker.dps; }

  update(delta: number, enemies: Enemy[], level: LevelConfig): void {
    this.effectsClock += delta;
    if (this.effectsClock >= 1) {
      this.effectsClock = 0;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (level.id === 'luxure') for (const ally of enemies) {
          if (ally !== enemy && ally.alive && Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y) < 100) ally.heal(ally.maxHp * 0.025);
        }
        if (level.id === 'envie' && this.towers.length) {
          const tower = this.towers.reduce((a, b) => Phaser.Math.Distance.Between(enemy.x, enemy.y, a.x, a.y) < Phaser.Math.Distance.Between(enemy.x, enemy.y, b.x, b.y) ? a : b);
          enemy.attackDamage = tower.damage;
          enemy.cloneRange = tower.range;
          enemy.cloneInterval = tower.interval;
          enemy.speed = Math.min(95, 36 + 22 / tower.interval);
          const max = Math.max(level.hp, tower.damage * 5);
          enemy.hp = Math.min(max, enemy.hp * max / enemy.maxHp); enemy.maxHp = max; enemy.heal(0);
        }
      }
    }
    for (const tower of this.towers) {
      tower.stunned = Math.max(0, tower.stunned - delta);
      const slow = level.slowZones.some(zone => { const point = center(zone); return Phaser.Math.Distance.Between(tower.x, tower.y, point.x, point.y) < zone.radius; });
      tower.cooldown -= delta * (slow ? 0.5 : 1);
      tower.setAlpha(tower.stunned > 0 ? 0.4 : 1);
      if (tower.stunned > 0 || tower.cooldown > 0) continue;
      const target = enemies.find(enemy => enemy.alive && Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y) <= tower.range);
      if (!target) continue;
      tower.cooldown = tower.interval;
      this.projectiles.push(new Projectile(this.scene, tower.x, tower.y, target, tower.damage * this.multiplier, tower.aoe, tower.kind === 'frost'));
    }
    this.projectiles = this.projectiles.filter(projectile => {
      const done = projectile.step(delta, (target, shot) => {
        const targets = shot.aoe ? enemies.filter(enemy => enemy.alive && Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y) <= 70) : [target];
        for (const enemy of targets) {
          if (!enemy.alive) continue;
          this.damageTracker.record(enemy.damage(shot.damage, this.execute));
          if (shot.frost) enemy.slowTime = 1.5;
          if (enemy.hp <= 0) { enemy.alive = false; this.onKill(enemy); }
        }
        if (shot.aoe) {
          const blast = this.scene.add.circle(target.x, target.y, 70, 0xf49d54, 0.15).setDepth(8);
          this.scene.tweens.add({ targets: blast, alpha: 0, duration: 200, onComplete: () => blast.destroy() });
        }
      });
      if (done) projectile.destroy(); return !done;
    });
  }
}
