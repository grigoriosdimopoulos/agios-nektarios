"use client";

import { useEffect, useRef, useState } from "react";

import type { Holiday } from "@/scene/calendar";

/** Bulb colours for each garland. */
const GARLANDS: Partial<Record<Holiday, string[]>> = {
  christmas: ["#ff5a4a", "#f7d071", "#68c98a", "#7fb2f0", "#f4f0e4"],
  newyear: ["#f7d071", "#f4f0e4", "#e8c46a", "#fff4d6"],
  easter: ["#f0c368", "#e2705f", "#f6e6c8", "#d8a04c"],
  patron: ["#e8c46a", "#f4ead6"],
};

const RIBBONS: Partial<Record<Holiday, string>> = {
  independence: "linear-gradient(90deg,#0d5eaf 0%,#f4f6f8 50%,#0d5eaf 100%)",
  ohi: "linear-gradient(90deg,#0d5eaf 0%,#f4f6f8 50%,#0d5eaf 100%)",
  christmas: "linear-gradient(90deg,rgba(200,72,60,0.9),rgba(240,206,140,0.9),rgba(104,201,138,0.85))",
  newyear: "linear-gradient(90deg,rgba(240,206,140,0.95),rgba(244,240,228,0.8),rgba(200,164,84,0.9))",
  easter: "linear-gradient(90deg,rgba(200,80,66,0.9),rgba(240,206,140,0.95),rgba(200,80,66,0.9))",
  patron: "linear-gradient(90deg,rgba(154,123,82,0.9),rgba(240,206,140,0.85),rgba(154,123,82,0.9))",
};

const SAG = 46;
const HEIGHT = 88;
const SPACING = 46;

/**
 * The garland is measured against the real width of the window rather than
 * stretched from a fixed viewBox: stretching turned the bulbs into ovals and
 * clipped the lowest of them where the wire sags.
 */
function Garland({ colors }: { colors: string[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => setWidth(host.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const bulbs = Math.max(6, Math.round(width / SPACING));
  const point = (t: number) => {
    const inv = 1 - t;
    return {
      x: width * t,
      // A quadratic hangs the wire; its lowest point is SAG below the ends.
      y: inv * inv * 6 + 2 * t * inv * (6 + SAG * 2) + t * t * 6,
    };
  };

  return (
    <div ref={hostRef} className="w-full" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden>
          <path
            d={`M0,6 Q${width / 2},${6 + SAG * 2} ${width},6`}
            fill="none"
            stroke="rgba(16,18,22,0.5)"
            strokeWidth="1.6"
          />
          {Array.from({ length: bulbs }, (_, i) => {
            const { x, y } = point(i / (bulbs - 1));
            const color = colors[i % colors.length];
            return (
              <g key={i}>
                <line x1={x} y1={y} x2={x} y2={y + 8} stroke="rgba(16,18,22,0.45)" strokeWidth="1.2" />
                <ellipse
                  className="holiday-bulb"
                  cx={x}
                  cy={y + 14}
                  rx="5"
                  ry="6.4"
                  fill={color}
                  style={{
                    animationDelay: `${(i % 7) * 0.32}s`,
                    filter: `drop-shadow(0 0 8px ${color})`,
                  }}
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** The Greek flag, on a short staff, rippling as cloth does. */
function GreekFlag() {
  const stripe = 20;
  return (
    <svg
      viewBox="0 0 300 190"
      className="h-[88px] w-auto md:h-[112px]"
      aria-label="Ελληνική σημαία"
    >
      <defs>
        <filter id="an-flag-cloth" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011 0.021"
            numOctaves="2"
            result="cloth"
          >
            <animate
              attributeName="baseFrequency"
              dur="11s"
              values="0.011 0.021;0.02 0.013;0.011 0.021"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="cloth"
            scale="13"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <linearGradient id="an-flag-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(0,0,0,0.28)" />
          <stop offset="0.28" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="0.62" stopColor="rgba(0,0,0,0.2)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.08)" />
        </linearGradient>
      </defs>

      <rect x="8" y="4" width="4" height="186" rx="2" fill="rgba(206,200,186,0.5)" />

      <g filter="url(#an-flag-cloth)">
        {Array.from({ length: 9 }, (_, i) => (
          <rect
            key={i}
            x="14"
            y={6 + i * stripe}
            width="278"
            height={stripe}
            fill={i % 2 === 0 ? "#0d5eaf" : "#f4f6f8"}
          />
        ))}
        <rect x="14" y="6" width={stripe * 5} height={stripe * 5} fill="#0d5eaf" />
        <rect x={14 + stripe * 2} y="6" width={stripe} height={stripe * 5} fill="#f4f6f8" />
        <rect x="14" y={6 + stripe * 2} width={stripe * 5} height={stripe} fill="#f4f6f8" />
        {/* Folds: the cloth is not flat lit. */}
        <rect x="14" y="6" width="278" height={stripe * 9} fill="url(#an-flag-shade)" />
      </g>
    </svg>
  );
}

/**
 * How a feast day shows on the site.
 *
 * The settlement has no street lighting, and anything painted into the
 * photograph reads as a sticker, so the day is dressed on the page itself:
 * a ribbon at the top edge, a garland of lights, a flag on the national days.
 */
export function HolidayDressing({ holiday }: { holiday: Holiday }) {
  if (holiday === "none") return null;

  const ribbon = RIBBONS[holiday];
  const garland = GARLANDS[holiday];
  const isNational = holiday === "independence" || holiday === "ohi";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[45]" aria-hidden>
      {ribbon && (
        <div className="h-[3px] w-full" style={{ backgroundImage: ribbon }} />
      )}
      {garland && <Garland colors={garland} />}
      {isNational && (
        <div className="absolute right-4 top-5 md:right-10 md:top-7">
          <GreekFlag />
        </div>
      )}
    </div>
  );
}
