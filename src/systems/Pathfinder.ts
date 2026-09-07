export interface Cell { col: number; row: number }
export const TILE = 48;
export const cellKey = (cell: Cell): string => `${cell.col},${cell.row}`;
export const center = (cell: Cell): { x: number; y: number } => ({ x: (cell.col + 0.5) * TILE, y: (cell.row + 0.5) * TILE });

export class Pathfinder {
  readonly cols = 18;
  readonly rows = 10;
  readonly start: Cell = { col: 0, row: 4 };
  readonly goal: Cell = { col: 17, row: 4 };
  readonly walls = new Set<string>();
  readonly towers = new Set<string>();
  temporary: Cell | null = null;
  version = 0;

  constructor() {
    for (let row = 0; row < 10; row++) {
      if (row < 7) { this.walls.add(`4,${row}`); this.walls.add(`14,${row}`); }
      if (row > 2) this.walls.add(`9,${row}`);
    }
  }

  inside(cell: Cell): boolean { return cell.col >= 0 && cell.col < this.cols && cell.row >= 0 && cell.row < this.rows; }
  blocked(cell: Cell, extra?: Cell): boolean {
    const key = cellKey(cell);
    return this.walls.has(key) || this.towers.has(key) || (this.temporary !== null && key === cellKey(this.temporary)) || (extra !== undefined && key === cellKey(extra));
  }

  find(start = this.start, extra?: Cell): Cell[] {
    if (!this.inside(start) || this.blocked(start, extra)) return [];
    const queue = [start];
    const previous = new Map<string, Cell | null>([[cellKey(start), null]]);
    for (let index = 0; index < queue.length; index++) {
      const current = queue[index]!;
      if (cellKey(current) === cellKey(this.goal)) {
        const path: Cell[] = [];
        let step: Cell | null = current;
        while (step) { path.unshift(step); step = previous.get(cellKey(step)) ?? null; }
        return path;
      }
      for (const [dc, dr] of [[1, 0], [0, 1], [0, -1], [-1, 0]]) {
        const next = { col: current.col + dc!, row: current.row + dr! };
        if (!this.inside(next) || this.blocked(next, extra) || previous.has(cellKey(next))) continue;
        previous.set(cellKey(next), current);
        queue.push(next);
      }
    }
    return [];
  }

  canPlace(cell: Cell, occupied: Cell[] = []): boolean {
    return this.inside(cell) && !this.blocked(cell) && cellKey(cell) !== cellKey(this.start) && cellKey(cell) !== cellKey(this.goal) &&
      !occupied.some(c => cellKey(c) === cellKey(cell)) && this.find(this.start, cell).length > 0 && occupied.every(c => this.find(c, cell).length > 0);
  }

  addTower(cell: Cell): void { this.towers.add(cellKey(cell)); this.version++; }
  moveObstacle(cell: Cell | null): void { this.temporary = cell; this.version++; }
}
