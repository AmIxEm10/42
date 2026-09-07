import configs from '../config/levels.json';
import type { CircleId } from '../services/MediaTypes';

export interface LevelConfig {
  id: CircleId; name: string; description: string; hp: number; speed: number;
  radius: number; color: string; waves: number; count: number; spawnInterval: number;
  reward: number; gateDamage: number; slowZones: { col: number; row: number; radius: number }[];
}

export class WaveManager {
  readonly levels: LevelConfig[];
  levelIndex = 0;
  wave = 0;
  active = false;

  constructor(data: unknown = configs) {
    if (!Array.isArray(data) || data.length !== 7) throw new Error('Sept cercles sont requis.');
    const ids = ['gourmandise', 'colere', 'avarice', 'paresse', 'luxure', 'envie', 'orgueil'];
    for (const [index, level] of data.entries()) {
      if (!level || level.id !== ids[index] || !['hp', 'speed', 'radius', 'count', 'waves', 'spawnInterval', 'reward', 'gateDamage'].every(key => Number.isFinite(level[key]) && level[key] > 0) || !Number.isInteger(level.waves) || !Number.isInteger(level.count)) throw new Error('Configuration de vague invalide.');
    }
    this.levels = data as LevelConfig[];
  }

  get level(): LevelConfig { return this.levels[this.levelIndex]!; }
  get count(): number { return this.level.count + (this.wave - 1) * 3; }
  get hpMultiplier(): number { return 1 + Math.max(0, this.wave - 1) * 0.25; }
  get hasBoss(): boolean { return this.level.id === 'orgueil' && this.wave === this.level.waves; }
  start(): void { if (!this.active && this.wave < this.level.waves) { this.wave++; this.active = true; } }
  finish(): void { this.active = false; }
  get circleComplete(): boolean { return !this.active && this.wave === this.level.waves; }
  nextCircle(): boolean {
    if (!this.circleComplete || this.levelIndex === this.levels.length - 1) return false;
    this.levelIndex++; this.wave = 0; return true;
  }
}
