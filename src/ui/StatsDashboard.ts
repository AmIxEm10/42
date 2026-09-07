interface Stats { kills: number; collected: number; totalDamage: number; remaining: number }
export class StatsDashboard {
  private readonly element = document.createElement('section');
  private readonly values: HTMLElement[];
  constructor(parent: HTMLElement) {
    this.element.className = 'stats-dashboard'; this.element.setAttribute('aria-label', 'Bilan de la partie');
    this.element.innerHTML = `<div><span>Âmes repoussées</span><strong></strong></div><div><span>Cendres récoltées</span><strong></strong></div><div><span>Dégâts infligés</span><strong></strong></div><div><span>Ennemis restants</span><strong></strong></div>`;
    this.values = [...this.element.querySelectorAll('strong')]; parent.append(this.element);
  }
  update(stats: Stats): void {
    [stats.kills, stats.collected, Math.round(stats.totalDamage), stats.remaining].forEach((value, index) => { const text = value.toLocaleString('fr-FR'); if (this.values[index]!.textContent !== text) this.values[index]!.textContent = text; });
  }
}
