import { clamp, fbm1, mulberry32 } from "../noise";
import { css, mix, scale, type RGB } from "../palette";
import type { Frame, Layer } from "../types";
import type { Season } from "../calendar";

type GroundPoint = { x: number; y: number };

type Ridge = {
  /** Screen-space top edge, sampled every few pixels. */
  points: { x: number; y: number }[];
  /** 0 = furthest away, 1 = closest. */
  depth: number;
  rock: RGB;
};

const RIDGE_SEED = 1970;

/** Ground colour of the plateau through the year. */
const GROUND: Record<Season, RGB> = {
  spring: [68, 78, 46],
  summer: [92, 84, 52],
  autumn: [82, 68, 44],
  winter: [58, 58, 52],
};

/**
 * The Kithairon ridge lines and the ground the village sits on.
 * Geometry is generated once per size; only the lighting changes per frame.
 */
export function createTerrainLayer(): Layer {
  let ridges: Ridge[] = [];
  let ground: GroundPoint[] = [];
  let width = 0;
  let height = 0;

  function build(frame: Frame) {
    const random = mulberry32(RIDGE_SEED);
    const layers = frame.quality === "low" ? 3 : 4;
    const step = frame.quality === "low" ? 14 : 7;

    ridges = Array.from({ length: layers }, (_, index) => {
      const depth = index / (layers - 1);
      const baseY = frame.horizonY - frame.height * (0.1 - depth * 0.085);
      const amplitude = frame.height * (0.11 - depth * 0.045);
      const frequency = 0.0016 + depth * 0.0022;
      const offset = random() * 400;

      const points: { x: number; y: number }[] = [];
      for (let x = -step; x <= frame.width + step; x += step) {
        const ridgeNoise =
          fbm1(x * frequency + offset, 5) * 0.75 +
          fbm1(x * frequency * 3.1 + offset * 2, 3) * 0.25;
        points.push({ x, y: baseY - (ridgeNoise - 0.5) * 2 * amplitude });
      }
      return {
        points,
        depth,
        rock: [
          58 + depth * 26,
          56 + depth * 22,
          52 + depth * 18,
        ] as RGB,
      };
    });

    // The plateau edge: a soft, uneven crest rather than a ruled line.
    ground = [];
    for (let x = -step; x <= frame.width + step; x += step) {
      const swell = fbm1(x * 0.0011 + 91, 4) - 0.5;
      const ripple = fbm1(x * 0.006 + 17, 2) - 0.5;
      ground.push({
        x,
        y: frame.groundY - swell * frame.height * 0.05 - ripple * frame.height * 0.012,
      });
    }
  }

  function drawRidge(ctx: CanvasRenderingContext2D, frame: Frame, ridge: Ridge) {
    const { lighting } = frame;
    // Atmospheric perspective: distant rock washes out toward the haze colour.
    const distance = 1 - ridge.depth;
    const lit = mix(
      scale(ridge.rock, 0.35 + 0.9 * lighting.ambientIntensity),
      lighting.sunColor,
      0.18 * lighting.sunIntensity + 0.1 * lighting.goldenFactor,
    );
    const body = mix(lit, lighting.hazeColor, clamp(distance * (0.34 + lighting.hazeDensity * 0.55)));

    ctx.beginPath();
    ctx.moveTo(ridge.points[0].x, ridge.points[0].y);
    for (const point of ridge.points) ctx.lineTo(point.x, point.y);
    ctx.lineTo(frame.width + 20, frame.height);
    ctx.lineTo(-20, frame.height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, frame.horizonY - frame.height * 0.2, 0, frame.groundY);
    gradient.addColorStop(0, css(body));
    gradient.addColorStop(1, css(scale(body, 0.62)));
    ctx.fillStyle = gradient;
    ctx.fill();

    // Sun-facing flank catches the key light.
    if (lighting.sunIntensity > 0.05) {
      const towardSun = frame.sunScreen.x < frame.width / 2 ? -1 : 1;
      ctx.save();
      ctx.clip();
      const rim = ctx.createLinearGradient(
        towardSun < 0 ? 0 : frame.width, 0,
        towardSun < 0 ? frame.width : 0, 0,
      );
      rim.addColorStop(0, css(lighting.sunColor, 0.13 * lighting.sunIntensity * (0.4 + ridge.depth)));
      rim.addColorStop(1, css(lighting.sunColor, 0));
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, frame.width, frame.height);
      ctx.restore();
    }

    // Lying snow on the upper faces.
    if (frame.snowCover > 0.02) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ridge.points[0].x, ridge.points[0].y);
      for (const point of ridge.points) ctx.lineTo(point.x, point.y);
      ctx.lineTo(frame.width + 20, frame.height);
      ctx.lineTo(-20, frame.height);
      ctx.closePath();
      ctx.clip();

      const snowColor = mix([236, 240, 248], lighting.sunColor, 0.22 * lighting.goldenFactor);
      ctx.strokeStyle = css(
        mix(snowColor, lighting.hazeColor, distance * 0.6),
        clamp(frame.snowCover * (0.22 + 0.3 * ridge.depth)),
      );
      ctx.lineWidth = 1.5 + frame.snowCover * 4 * (0.4 + ridge.depth);
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(ridge.points[0].x, ridge.points[0].y + 1);
      for (const point of ridge.points) ctx.lineTo(point.x, point.y + 1);
      ctx.stroke();
      ctx.restore();
    }
  }

  return {
    name: "terrain",
    resize(frame) {
      width = frame.width;
      height = frame.height;
      build(frame);
    },
    draw(ctx, frame) {
      if (width !== frame.width || height !== frame.height) {
        width = frame.width;
        height = frame.height;
        build(frame);
      }

      for (const ridge of ridges) drawRidge(ctx, frame, ridge);

      // The plateau the settlement stands on.
      const { lighting } = frame;
      if (ground.length === 0) build(frame);
      const seasonGround = GROUND[frame.season];
      const groundLit = mix(
        scale(seasonGround, 0.28 + 0.95 * lighting.ambientIntensity),
        lighting.sunColor,
        0.16 * lighting.sunIntensity,
      );
      const groundColor = mix(groundLit, [232, 238, 246], frame.snowCover * 0.82);

      const gradient = ctx.createLinearGradient(0, frame.groundY - frame.height * 0.07, 0, frame.height);
      gradient.addColorStop(0, css(mix(groundColor, lighting.hazeColor, 0.28)));
      gradient.addColorStop(0.4, css(groundColor));
      gradient.addColorStop(1, css(scale(groundColor, 0.58)));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(ground[0].x, ground[0].y);
      for (const point of ground) ctx.lineTo(point.x, point.y);
      ctx.lineTo(frame.width + 20, frame.height);
      ctx.lineTo(-20, frame.height);
      ctx.closePath();
      ctx.fill();
    },
  };
}
