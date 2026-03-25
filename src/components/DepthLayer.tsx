import type { CSSProperties } from "react";

/**
 * Zero-overhead parallax layer.
 * Reads global --cx / --cy (CursorProvider) via .depth-layer CSS class.
 * --depth-sx / --depth-sy control per-layer speed, set once at render.
 */
export function DepthLayer({
  children,
  className = "",
  factor = 1,
}: {
  children: React.ReactNode;
  className?: string;
  factor?: number;
}) {
  return (
    <div
      className={`depth-layer ${className}`}
      style={
        {
          "--depth-sx": `${Math.round(factor * 24)}px`,
          "--depth-sy": `${Math.round(factor * 15)}px`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
