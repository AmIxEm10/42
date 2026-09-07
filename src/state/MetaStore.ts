interface Save { souls: number; gateLevel: number; arcane: boolean }
export class MetaStore {
  private static instance: MetaStore;
  private data: Save = { souls: 0, gateLevel: 0, arcane: false };
  static get shared(): MetaStore { return this.instance ??= new MetaStore(); }
  private constructor() {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('hellgate.meta.v1') ?? 'null');
      if (saved && typeof saved === 'object' && 'souls' in saved && 'gateLevel' in saved && 'arcane' in saved &&
        Number.isInteger(saved.souls) && Number(saved.souls) >= 0 && Number.isInteger(saved.gateLevel) && Number(saved.gateLevel) >= 0 && Number(saved.gateLevel) <= 10 && typeof saved.arcane === 'boolean') this.data = saved as Save;
    } catch { /* Le jeu reste utilisable sans stockage local. */ }
  }
  get souls(): number { return this.data.souls; }
  get gateLevel(): number { return this.data.gateLevel; }
  get arcane(): boolean { return this.data.arcane; }
  get gateCost(): number { return 6 + this.data.gateLevel * 3; }
  reward(amount: number): void { this.data.souls += amount; this.save(); }
  upgradeGate(): boolean {
    if (this.data.gateLevel >= 10 || this.data.souls < this.gateCost) return false;
    this.data.souls -= this.gateCost; this.data.gateLevel++; this.save(); return true;
  }
  unlockArcane(): boolean {
    if (this.data.arcane || this.data.souls < 8) return false;
    this.data.souls -= 8; this.data.arcane = true; this.save(); return true;
  }
  private save(): void { try { localStorage.setItem('hellgate.meta.v1', JSON.stringify(this.data)); } catch { /* Session en mémoire. */ } }
}
