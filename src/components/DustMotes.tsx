"use client";

/**
 * Very subtle drifting points — dust in light. Pure CSS, GPU-friendly.
 */
export function DustMotes({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="dust-mote absolute rounded-full bg-[rgba(232,228,214,0.12)]"
          style={{
            width: m.s,
            height: m.s,
            left: `${m.x}%`,
            top: `${m.y}%`,
            animationDelay: `${m.d}s`,
            animationDuration: `${m.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

const MOTES = [
  { x: 8, y: 15, s: 2, d: 0, dur: 28 },
  { x: 22, y: 42, s: 1.5, d: 4, dur: 32 },
  { x: 45, y: 18, s: 2.5, d: 2, dur: 24 },
  { x: 62, y: 55, s: 1, d: 8, dur: 36 },
  { x: 78, y: 28, s: 2, d: 1, dur: 30 },
  { x: 88, y: 72, s: 1.5, d: 6, dur: 26 },
  { x: 35, y: 68, s: 1, d: 10, dur: 34 },
  { x: 55, y: 38, s: 2, d: 3, dur: 29 },
];
