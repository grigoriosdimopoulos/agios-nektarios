"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
}

function spawn(w: number, h: number): Mote {
  return {
    x: Math.random() * w,
    y: h + Math.random() * 60,
    vx: (Math.random() - 0.5) * 0.2,
    vy: -(Math.random() * 0.28 + 0.06),
    r: Math.random() * 1.3 + 0.2,
    life: 0,
    maxLife: Math.random() * 340 + 180,
  };
}

/** Rising dust-mote canvas — 60fps, GPU-composited, zero React re-renders */
export function ParticleField({ count = 38, className = "" }: { count?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const motes: Mote[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    for (let i = 0; i < count; i++) {
      const m = spawn(W(), H());
      m.life = Math.floor(Math.random() * m.maxLife);
      m.y = Math.random() * H();
      motes.push(m);
    }

    const tick = () => {
      ctx.clearRect(0, 0, W(), H());
      for (const m of motes) {
        m.life++;
        m.x += m.vx;
        m.y += m.vy;
        const t = m.life / m.maxLife;
        const alpha = t < 0.2 ? (t / 0.2) * 0.5 : t > 0.75 ? ((1 - t) / 0.25) * 0.5 : 0.5;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,228,214,${(alpha * 0.52).toFixed(3)})`;
        ctx.fill();
        if (m.life >= m.maxLife || m.y < -10) Object.assign(m, spawn(W(), H()), { life: 0 });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count, reduced]);

  return (
    <canvas
      ref={ref}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
