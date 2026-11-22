import { useCallback, useEffect, useRef, useState } from 'react';
import { Dir, SIZE, Tile, canMove, move, newBoard, spawn } from './game';

const readBest = () => { try { return Number(localStorage.getItem('nm-best')) || 0; } catch { return 0; } };
const saveBest = (n: number) => { try { localStorage.setItem('nm-best', String(n)); } catch { /* private mode */ } };

export default function App() {
  const [tiles, setTiles] = useState<Tile[]>(newBoard);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const [pop, setPop] = useState<{ n: number; k: number } | null>(null);
  const over = !canMove(tiles);
  const start = useRef<{ x: number; y: number } | null>(null);

  const play = useCallback((dir: Dir) => {
    setTiles(prev => {
      const r = move(prev, dir);
      if (!r.moved) return prev;
      if (r.gained) {
        setScore(s => {
          const n = s + r.gained;
          setBest(b => { if (n > b) { saveBest(n); return n; } return b; });
          return n;
        });
        setPop({ n: r.gained, k: Date.now() });
        try { (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch { /* outside Telegram */ }
      }
      return spawn(r.tiles);
    });
  }, []);

  useEffect(() => {
    const keys: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const onKey = (e: KeyboardEvent) => { const d = keys[e.key]; if (d) { e.preventDefault(); play(d); } };
    addEventListener('keydown', onKey);
    try { (window as any).Telegram?.WebApp?.ready(); (window as any).Telegram?.WebApp?.expand(); } catch { /* outside Telegram */ }
    return () => removeEventListener('keydown', onKey);
  }, [play]);

  const restart = () => { setTiles(newBoard()); setScore(0); };
  const biggest = Math.max(...tiles.map(t => t.value));

  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <span className="logo">◆</span>
          <div>
            <h1>Neon Merge</h1>
            <p>Swipe to merge. Reach 2048.</p>
          </div>
        </div>
        <button className="ghost" onClick={restart} aria-label="New game">↻</button>
      </header>

      <section className="stats">
        <div className="stat"><span>Score</span><b>{score.toLocaleString()}</b>{pop && <i key={pop.k} className="pop">+{pop.n}</i>}</div>
        <div className="stat"><span>Best</span><b>{best.toLocaleString()}</b></div>
        <div className="stat"><span>Top tile</span><b>{biggest}</b></div>
      </section>

      <section
        className="board"
        onPointerDown={e => { start.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={e => {
          const s = start.current; start.current = null;
          if (!s) return;
          const dx = e.clientX - s.x, dy = e.clientY - s.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          play(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        }}
      >
        {Array.from({ length: SIZE * SIZE }, (_, i) => <div key={'c' + i} className="cell" />)}
        {tiles.map(t => (
          <div
            key={t.id}
            className={'tile v' + Math.min(t.value, 4096) + (t.merged ? ' merged' : '') + (t.fresh ? ' fresh' : '')}
            style={{ '--r': t.row, '--c': t.col } as React.CSSProperties}
          >
            {t.value}
          </div>
        ))}
        {over && (
          <div className="over">
            <h2>No moves left</h2>
            <p>Score {score.toLocaleString()}</p>
            <button onClick={restart}>Play again</button>
          </div>
        )}
      </section>

      <footer className="hint">Swipe on the board · arrows on a keyboard</footer>
    </main>
  );
}
