import Phaser from 'phaser';
import { Pathfinder, center, TILE } from '../systems/Pathfinder';
import type { Tower } from '../entities/Tower';
import type { LevelConfig } from '../systems/WaveManager';

export class BoardRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, private readonly grid: Pathfinder) { this.graphics = scene.add.graphics().setDepth(0); }
  draw(level: LevelConfig, selected: Tower | null): void {
    const g = this.graphics; g.clear();
    g.fillStyle(0x13121a, 0.92); g.fillRect(0, 0, 864, 480);
    g.lineStyle(1, 0x34303b, 0.55);
    for (let col = 0; col <= 18; col++) g.lineBetween(col * TILE, 0, col * TILE, 480);
    for (let row = 0; row <= 10; row++) g.lineBetween(0, row * TILE, 864, row * TILE);
    const path = this.grid.find();
    g.lineStyle(15, 0x685649, 0.38);
    for (let i = 1; i < path.length; i++) { const a = center(path[i - 1]!); const b = center(path[i]!); g.lineBetween(a.x, a.y, b.x, b.y); }
    for (const key of this.grid.walls) {
      const [col, row] = key.split(',').map(Number);
      g.fillStyle(0x2f2b35); g.fillRect(col! * TILE + 3, row! * TILE + 3, TILE - 6, TILE - 6);
      g.lineStyle(1, 0x4d4552); g.strokeRect(col! * TILE + 3, row! * TILE + 3, TILE - 6, TILE - 6);
    }
    for (const zone of level.slowZones) { const point = center(zone); g.fillStyle(0x8a59bd, 0.13); g.fillCircle(point.x, point.y, zone.radius); }
    if (this.grid.temporary) { const point = center(this.grid.temporary); g.fillStyle(0xc4b4df, 0.7); g.fillRect(point.x - 20, point.y - 20, 40, 40); }
    if (selected) { g.lineStyle(2, 0xffc880, 0.5); g.strokeCircle(selected.x, selected.y, selected.range); g.lineStyle(2, 0xffcd8e); g.strokeRect(selected.x - 23, selected.y - 23, 46, 46); }
  }
}
