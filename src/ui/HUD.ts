interface Snapshot { ashes: number; souls: number; hp: number; maxHp: number; dps: number }
export class HUD {
  private readonly element = document.createElement('section');
  private readonly values: HTMLElement[];
  private readonly meter: HTMLMeterElement;
  constructor(parent: HTMLElement) {
    this.element.className = 'hud-strip'; this.element.setAttribute('aria-label', 'Statistiques de la défense');
    this.element.innerHTML = `<div><span>Cendres</span><strong data-value></strong></div><div><span>Âmes Noires</span><strong data-value></strong></div><div><span>Porte des Enfers</span><strong data-value></strong><meter min="0" max="100" value="100" aria-label="Points de vie de la Porte"></meter></div><div><span>DPS · 3 secondes</span><strong data-value></strong></div>`;
    this.values = [...this.element.querySelectorAll<HTMLElement>('[data-value]')];
    this.meter = this.element.querySelector('meter')!; parent.append(this.element);
  }
  update(data: Snapshot): void {
    const texts = [Math.floor(data.ashes).toString(), data.souls.toString(), `${Math.ceil(data.hp)} / ${Math.ceil(data.maxHp)}`, data.dps.toFixed(1)];
    texts.forEach((text, index) => { if (this.values[index]!.textContent !== text) this.values[index]!.textContent = text; });
    this.meter.max = data.maxHp; this.meter.value = data.hp;
  }
}
