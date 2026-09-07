export class Spawner {
  remaining = 0;
  private elapsed = 0;
  private interval = 1;
  start(count: number, interval: number): void { this.remaining = count; this.interval = interval; this.elapsed = interval; }
  update(delta: number, spawn: (last: boolean) => void): void {
    this.elapsed += delta;
    if (this.remaining > 0 && this.elapsed >= this.interval) {
      this.elapsed = 0; this.remaining--; spawn(this.remaining === 0);
    }
  }
}
