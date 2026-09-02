import { lerp, smoothstep } from "./noise";
import { mix, type RGB } from "./palette";
import type { Season } from "./calendar";

/**
 * Leaf colour through the year for the two kinds of tree on the mountain:
 * firs and pines that stay dark, and oaks and planes that turn and fall.
 */
export type Foliage = {
  canopy: RGB;
  /** 0 = bare, 1 = full canopy. */
  density: number;
  /** 0–1 — how much blossom sits in the branches. */
  blossom: number;
  /** 0–1 — ripe fruit and acorns ready to drop. */
  fruit: number;
};

const SPRING_GREEN: RGB = [96, 138, 62];
const SUMMER_GREEN: RGB = [64, 96, 48];
const AUTUMN_GOLD: RGB = [162, 116, 46];
const AUTUMN_RUST: RGB = [138, 74, 38];
const CONIFER: RGB = [38, 62, 46];

export function broadleafFoliage(season: Season, t: number): Foliage {
  switch (season) {
    case "spring":
      return {
        canopy: mix(SPRING_GREEN, SUMMER_GREEN, smoothstep(0.4, 1, t)),
        density: lerp(0.35, 1, smoothstep(0, 0.45, t)),
        blossom: (1 - smoothstep(0.15, 0.6, t)) * smoothstep(-0.1, 0.12, t),
        fruit: 0,
      };
    case "summer":
      return {
        canopy: mix(SUMMER_GREEN, [78, 92, 44], smoothstep(0.5, 1, t)),
        density: 1,
        blossom: 0,
        fruit: smoothstep(0.55, 1, t) * 0.5,
      };
    case "autumn":
      return {
        canopy: mix(
          mix(SUMMER_GREEN, AUTUMN_GOLD, smoothstep(0, 0.45, t)),
          AUTUMN_RUST,
          smoothstep(0.4, 0.9, t),
        ),
        density: 1 - smoothstep(0.45, 1, t) * 0.85,
        blossom: 0,
        fruit: (1 - smoothstep(0.3, 0.75, t)) * 0.9,
      };
    case "winter":
      return {
        canopy: mix(AUTUMN_RUST, [92, 74, 56], 0.5),
        density: 0.08,
        blossom: 0,
        fruit: 0,
      };
  }
}

export function coniferFoliage(season: Season): Foliage {
  return {
    canopy: season === "winter" ? mix(CONIFER, [30, 48, 44], 0.5) : CONIFER,
    density: 1,
    blossom: 0,
    fruit: season === "autumn" ? 0.3 : 0,
  };
}

/** Palette a falling leaf is tinted from. */
export function fallingLeafColor(season: Season, tone: number): RGB {
  if (season === "spring") return mix([232, 214, 226], SPRING_GREEN, tone * 0.5);
  if (season === "summer") return mix(SUMMER_GREEN, AUTUMN_GOLD, tone * 0.35);
  if (season === "autumn") return mix(AUTUMN_GOLD, AUTUMN_RUST, tone);
  return mix([132, 104, 78], [96, 78, 60], tone);
}
