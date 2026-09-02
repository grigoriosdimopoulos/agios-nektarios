import { mulberry32 } from "../noise";
import { css, mix, scale, type RGB } from "../palette";
import type { Frame, Layer } from "../types";

type Tuft = { x: number; y: number; h: number; lean: number; blades: number; phase: number };
type Stone = { x: number; y: number; rx: number; ry: number };

const FOREGROUND_SEED = 5150;

const DRY: RGB = [104, 96, 58];
const GREEN: RGB = [74, 92, 48];

/** Thyme, dry grass and limestone in the very front of the frame. */
export function createForegroundLayer(): Layer {
  let tufts: Tuft[] = [];
  let stones: Stone[] = [];
  let width = 0;
  let height = 0;

  function build(frame: Frame) {
    const random = mulberry32(FOREGROUND_SEED);
    const count =
      frame.quality === "low" ? 34 : frame.quality === "medium" ? 70 : 120;

    tufts = Array.from({ length: count }, () => {
      const depth = random();
      return {
        x: random() * frame.width * 1.05 - frame.width * 0.025,
        y: frame.height * (0.86 + depth * 0.2),
        h: frame.height * (0.02 + depth * 0.05),
        lean: (random() - 0.5) * 0.4,
        blades: 3 + Math.floor(random() * 4),
        phase: random() * Math.PI * 2,
      };
    }).sort((a, b) => a.y - b.y);

    stones = Array.from({ length: frame.quality === "low" ? 4 : 9 }, () => ({
      x: random() * frame.width,
      y: frame.height * (0.9 + random() * 0.12),
      rx: frame.height * (0.012 + random() * 0.022),
      ry: frame.height * (0.006 + random() * 0.01),
    }));
  }

  return {
    name: "foreground",
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

      const { lighting } = frame;
      const light = 0.2 + 0.9 * lighting.ambientIntensity;
      const seasonal = frame.season === "summer" || frame.season === "autumn" ? DRY : GREEN;
      const base = mix(
        scale(seasonal, light),
        lighting.sunColor,
        0.16 * lighting.sunIntensity,
      );
      const snowy = mix(base, [236, 240, 248], frame.snowCover * 0.8);

      for (const stone of stones) {
        ctx.fillStyle = css(
          mix(scale([96, 92, 84], light), [236, 240, 248], frame.snowCover * 0.7),
        );
        ctx.beginPath();
        ctx.ellipse(stone.x, stone.y, stone.rx, stone.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineCap = "round";
      for (const tuft of tufts) {
        // Grass bends further than branches: it is light and has no wood in it.
        const bend = frame.wind.force * 0.9 + Math.sin(frame.time * 2.6 + tuft.phase) * frame.wind.force * 0.35;
        ctx.strokeStyle = css(scale(snowy, 0.75 + (tuft.y / frame.height - 0.86) * 1.2), 0.9);
        ctx.lineWidth = Math.max(1, frame.height * 0.0016);
        for (let i = 0; i < tuft.blades; i++) {
          const offset = (i / (tuft.blades - 1) - 0.5) * tuft.h * 0.5;
          const tipX = tuft.x + offset + (tuft.lean + bend) * tuft.h;
          ctx.beginPath();
          ctx.moveTo(tuft.x + offset * 0.4, tuft.y);
          ctx.quadraticCurveTo(
            tuft.x + offset * 0.7 + (tuft.lean + bend) * tuft.h * 0.35,
            tuft.y - tuft.h * 0.6,
            tipX,
            tuft.y - tuft.h,
          );
          ctx.stroke();
        }
      }
    },
  };
}
