export class EconomyManager {
  ashes = 300;
  collected = 0;
  kills = 0;
  spend(amount: number): boolean {
    if (!Number.isFinite(amount) || amount < 0 || this.ashes < amount) return false;
    this.ashes -= amount; return true;
  }
  collect(amount: number): void { this.ashes += amount; this.collected += amount; }
}
