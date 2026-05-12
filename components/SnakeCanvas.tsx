'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Point = { x: number; y: number };
type Direction = { x: number; y: number };

type SnakeCanvasProps = {
  active: boolean;
  enabled: boolean;
  sessionId: number;
  onGameEnd: (score: number) => void;
};

const CELLS = 22;
const PIXELS = 704;
const CELL_SIZE = PIXELS / CELLS;

const START_SNAKE: Point[] = [
  { x: 10, y: 11 },
  { x: 9, y: 11 },
  { x: 8, y: 11 }
];

function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function randomFood(snake: Point[]): Point {
  let food: Point;
  do {
    food = {
      x: Math.floor(Math.random() * CELLS),
      y: Math.floor(Math.random() * CELLS)
    };
  } while (snake.some((part) => samePoint(part, food)));
  return food;
}

function isOpposite(a: Direction, b: Direction) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

export function SnakeCanvas({ active, enabled, sessionId, onGameEnd }: SnakeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snakeRef = useRef<Point[]>(START_SNAKE);
  const foodRef = useRef<Point>(randomFood(START_SNAKE));
  const directionRef = useRef<Direction>({ x: 1, y: 0 });
  const nextDirectionRef = useRef<Direction>({ x: 1, y: 0 });
  const touchStartRef = useRef<Point | null>(null);
  const endedRef = useRef(false);

  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [alive, setAlive] = useState(true);
  const [tickIndex, setTickIndex] = useState(0);

  const delay = useMemo(() => Math.max(110, 220 - score * 4), [score]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = PIXELS * dpr;
    canvas.height = PIXELS * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, PIXELS, PIXELS);

    const gradient = ctx.createLinearGradient(0, 0, PIXELS, PIXELS);
    gradient.addColorStop(0, '#07170d');
    gradient.addColorStop(1, '#020805');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, PIXELS, PIXELS);

    ctx.strokeStyle = 'rgba(72, 255, 138, 0.085)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CELLS; i += 1) {
      const p = i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, PIXELS);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(PIXELS, p);
      ctx.stroke();
    }

    const food = foodRef.current;
    const pulse = 1 + Math.sin(Date.now() / 140) * 0.09;
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.shadowBlur = 22;
    ctx.shadowColor = '#ff4d8d';
    ctx.fillStyle = '#ff4d8d';
    ctx.beginPath();
    ctx.arc(fx, fy, CELL_SIZE * 0.34 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.beginPath();
    ctx.arc(fx - 3, fy - 4, CELL_SIZE * 0.08, 0, Math.PI * 2);
    ctx.fill();

    const snake = snakeRef.current;
    snake.forEach((part, index) => {
      const x = part.x * CELL_SIZE + 2;
      const y = part.y * CELL_SIZE + 2;
      const radius = index === 0 ? 9 : 7;
      const size = CELL_SIZE - 4;
      ctx.shadowBlur = index === 0 ? 20 : 12;
      ctx.shadowColor = '#48ff8a';
      ctx.fillStyle = index === 0 ? '#82ff9f' : `rgba(72, 255, 138, ${Math.max(0.38, 1 - index * 0.035)})`;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, radius);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (index === 0) {
        ctx.fillStyle = '#06100b';
        const eyeOffsetX = directionRef.current.x !== 0 ? directionRef.current.x * 3 : 0;
        const eyeOffsetY = directionRef.current.y !== 0 ? directionRef.current.y * 3 : 0;
        ctx.beginPath();
        ctx.arc(x + size * 0.34 + eyeOffsetX, y + size * 0.34 + eyeOffsetY, 2.2, 0, Math.PI * 2);
        ctx.arc(x + size * 0.66 + eyeOffsetX, y + size * 0.34 + eyeOffsetY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.strokeStyle = 'rgba(72, 255, 138, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, PIXELS - 2, PIXELS - 2);
  }, []);

  const reset = useCallback(() => {
    snakeRef.current = START_SNAKE.map((part) => ({ ...part }));
    foodRef.current = randomFood(snakeRef.current);
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    endedRef.current = false;
    setScore(0);
    setPaused(false);
    setAlive(true);
    setTickIndex((v) => v + 1);
    requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => {
    if (active) reset();
  }, [active, reset, sessionId]);

  useEffect(() => {
    if (!enabled && active) setPaused(true);
  }, [active, enabled]);

  const setDirection = useCallback((newDirection: Direction) => {
    if (isOpposite(directionRef.current, newDirection)) return;
    nextDirectionRef.current = newDirection;
  }, []);

  const endGame = useCallback((finalScore: number) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setAlive(false);
    setPaused(false);
    onGameEnd(finalScore);
  }, [onGameEnd]);

  const step = useCallback(() => {
    if (!active || !enabled || paused || !alive) return;

    directionRef.current = nextDirectionRef.current;
    const snake = snakeRef.current;
    const head = snake[0];
    const nextHead = {
      x: head.x + directionRef.current.x,
      y: head.y + directionRef.current.y
    };

    const hitWall = nextHead.x < 0 || nextHead.x >= CELLS || nextHead.y < 0 || nextHead.y >= CELLS;
    const hitSelf = snake.some((part) => samePoint(part, nextHead));

    if (hitWall || hitSelf) {
      endGame(score);
      return;
    }

    const nextSnake = [nextHead, ...snake];
    if (samePoint(nextHead, foodRef.current)) {
      const nextScore = score + 1;
      setScore(nextScore);
      foodRef.current = randomFood(nextSnake);
    } else {
      nextSnake.pop();
    }

    snakeRef.current = nextSnake;
    draw();
    setTickIndex((v) => v + 1);
  }, [active, alive, draw, enabled, endGame, paused, score]);

  useEffect(() => {
    if (!active || !enabled || paused || !alive) {
      draw();
      return;
    }
    const timer = window.setTimeout(step, delay);
    return () => window.clearTimeout(timer);
  }, [active, alive, delay, draw, enabled, paused, step, tickIndex]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) {
        event.preventDefault();
      }
      if (key === 'arrowup' || key === 'w') setDirection({ x: 0, y: -1 });
      if (key === 'arrowdown' || key === 's') setDirection({ x: 0, y: 1 });
      if (key === 'arrowleft' || key === 'a') setDirection({ x: -1, y: 0 });
      if (key === 'arrowright' || key === 'd') setDirection({ x: 1, y: 0 });
      if (key === ' ') setPaused((value) => !value);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setDirection]);

  useEffect(() => {
    draw();
  }, [draw]);

  function handleTouchStart(event: React.TouchEvent<HTMLCanvasElement>) {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLCanvasElement>) {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    else setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    touchStartRef.current = null;
  }

  return (
    <div className="arcade-panel neon-border overflow-hidden rounded-[2rem] p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-arcade text-xs uppercase tracking-[0.28em] text-emerald-300/75">Canvas Game</p>
          <p className="font-arcade text-3xl font-black text-white">{score.toString().padStart(3, '0')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
            disabled={!active || !alive}
            onClick={() => setPaused((value) => !value)}
            type="button"
          >
            {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
          <button
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
            disabled={!active}
            onClick={reset}
            type="button"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[780px] overflow-hidden rounded-[1.5rem] border border-emerald-300/30 bg-black shadow-neon xl:max-w-[820px]">
        <canvas
          className="canvas-crisp h-full w-full touch-none"
          height={PIXELS}
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
          ref={canvasRef}
          width={PIXELS}
        />
        {!active && (
          <div className="absolute inset-0 grid place-items-center bg-black/68 p-6 text-center backdrop-blur-sm">
            <div>
              <p className="font-arcade text-2xl font-black text-emerald-300">INSERT ARC USDC</p>
              <p className="mt-2 text-sm text-zinc-300">Pay the 0.1 testnet USDC entry fee to start a session.</p>
            </div>
          </div>
        )}
        {active && paused && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 p-6 text-center backdrop-blur-sm">
            <div>
              <p className="font-arcade text-2xl font-black text-amber-300">PAUSED</p>
              <p className="mt-2 text-sm text-zinc-300">Switch back to Arc Testnet or press pause to continue.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
        <span />
        <button className="rounded-2xl bg-white/10 py-3 font-black text-white" onClick={() => setDirection({ x: 0, y: -1 })} type="button">↑</button>
        <span />
        <button className="rounded-2xl bg-white/10 py-3 font-black text-white" onClick={() => setDirection({ x: -1, y: 0 })} type="button">←</button>
        <button className="rounded-2xl bg-emerald-300 py-3 font-black text-[#06100b]" onClick={() => setPaused((value) => !value)} type="button">●</button>
        <button className="rounded-2xl bg-white/10 py-3 font-black text-white" onClick={() => setDirection({ x: 1, y: 0 })} type="button">→</button>
        <span />
        <button className="rounded-2xl bg-white/10 py-3 font-black text-white" onClick={() => setDirection({ x: 0, y: 1 })} type="button">↓</button>
        <span />
      </div>
    </div>
  );
}
