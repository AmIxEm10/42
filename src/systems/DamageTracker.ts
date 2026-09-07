/** DPS sur trois secondes de simulation, fondé sur les PV réellement retirés. */
export class DamageTracker {
  private time = 0;
  private hits: { time: number; amount: number }[] = [];
  total = 0;
  record(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.total += amount; this.hits.push({ time: this.time, amount });
  }
  advance(delta: number): void {
    this.time += delta; this.hits = this.hits.filter(hit => this.time - hit.time < 3);
  }
  get dps(): number { return this.hits.reduce((sum, hit) => sum + hit.amount, 0) / 3; }
}
