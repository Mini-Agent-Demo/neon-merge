export type Tile = { id: number; value: number; row: number; col: number; merged?: boolean; fresh?: boolean };
export type Dir = 'up' | 'down' | 'left' | 'right';

export const SIZE = 4;
let nextId = 1;

export function spawn(tiles: Tile[]): Tile[] {
  const used = new Set(tiles.map(t => t.row * SIZE + t.col));
  const free: number[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) if (!used.has(i)) free.push(i);
  if (!free.length) return tiles;
  const at = free[Math.floor(Math.random() * free.length)];
  return [...tiles, { id: nextId++, value: Math.random() < 0.9 ? 2 : 4, row: Math.floor(at / SIZE), col: at % SIZE, fresh: true }];
}

export function newBoard(): Tile[] {
  return spawn(spawn([]));
}

/** Slides every line toward `dir`, merging equal neighbours once. Returns the new tiles and the points earned. */
export function move(tiles: Tile[], dir: Dir): { tiles: Tile[]; gained: number; moved: boolean } {
  const out: Tile[] = [];
  let gained = 0;
  let moved = false;
  for (let line = 0; line < SIZE; line++) {
    const cells = tiles
      .filter(t => (dir === 'left' || dir === 'right' ? t.row === line : t.col === line))
      .sort((a, b) => {
        const ka = dir === 'left' || dir === 'right' ? a.col : a.row;
        const kb = dir === 'left' || dir === 'right' ? b.col : b.row;
        return dir === 'left' || dir === 'up' ? ka - kb : kb - ka;
      });
    let slot = 0;
    for (let i = 0; i < cells.length; i++) {
      const t = cells[i];
      const n = cells[i + 1];
      const pos = dir === 'left' || dir === 'up' ? slot : SIZE - 1 - slot;
      const place = (x: Tile) => (dir === 'left' || dir === 'right' ? { ...x, row: line, col: pos } : { ...x, row: pos, col: line });
      if (n && n.value === t.value) {
        const merged = { ...place(t), id: nextId++, value: t.value * 2, merged: true, fresh: false };
        gained += merged.value;
        moved = true;
        out.push(merged);
        i++;
      } else {
        const p = { ...place(t), merged: false, fresh: false };
        if (p.row !== t.row || p.col !== t.col) moved = true;
        out.push(p);
      }
      slot++;
    }
  }
  return { tiles: out, gained, moved };
}

export function canMove(tiles: Tile[]): boolean {
  if (tiles.length < SIZE * SIZE) return true;
  const at = (r: number, c: number) => tiles.find(t => t.row === r && t.col === c)?.value;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const v = at(r, c);
      if (v === at(r, c + 1) || v === at(r + 1, c)) return true;
    }
  return false;
}
