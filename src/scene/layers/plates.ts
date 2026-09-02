import { css, mix, scale } from "../palette";
import type { Frame, Layer } from "../types";

type PlateKey = "sky" | "far" | "mid" | "near";

/**
 * Optional photographic backdrops uploaded through the admin area.
 * Each plate is drawn, then graded with the same light the procedural scene
 * uses, so a real photograph of the village still turns gold at sunset and
 * blue at dusk.
 */
export function createPlateLayer(
  urls: Record<PlateKey, string>,
  slot: "sky" | "ground",
): Layer {
  const images = new Map<PlateKey, HTMLImageElement>();
  const keys: PlateKey[] = slot === "sky" ? ["sky"] : ["far", "mid", "near"];

  for (const key of keys) {
    const url = urls[key];
    if (!url) continue;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    images.set(key, image);
  }

  function drawPlate(
    ctx: CanvasRenderingContext2D,
    frame: Frame,
    image: HTMLImageElement,
    top: number,
    height: number,
    depth: number,
  ) {
    if (!image.complete || image.naturalWidth === 0) return;

    // Cover-fit the photograph across the band.
    const targetRatio = frame.width / height;
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    if (sourceRatio > targetRatio) {
      sw = image.naturalHeight * targetRatio;
    } else {
      sh = image.naturalWidth / targetRatio;
    }
    const sx = (image.naturalWidth - sw) / 2;
    const sy = (image.naturalHeight - sh) / 2;

    ctx.drawImage(image, sx, sy, sw, sh, 0, top, frame.width, height);

    const { lighting } = frame;
    // Multiply by the ambient light, then add the key light back on top.
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = css(
      scale(mix(lighting.ambient, [255, 255, 255], 0.25), 0.3 + 0.85 * lighting.ambientIntensity),
    );
    ctx.fillRect(0, top, frame.width, height);
    ctx.restore();

    if (lighting.sunIntensity > 0.03 || lighting.goldenFactor > 0.03) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = css(
        lighting.sunColor,
        0.1 * lighting.sunIntensity + 0.16 * lighting.goldenFactor,
      );
      ctx.fillRect(0, top, frame.width, height);
      ctx.restore();
    }

    // Aerial perspective for the more distant plates.
    if (depth < 1) {
      ctx.fillStyle = css(lighting.hazeColor, (1 - depth) * lighting.hazeDensity * 0.5);
      ctx.fillRect(0, top, frame.width, height);
    }
  }

  return {
    name: `plates-${slot}`,
    draw(ctx, frame) {
      if (slot === "sky") {
        const image = images.get("sky");
        if (image) drawPlate(ctx, frame, image, 0, frame.horizonY * 1.02, 0.35);
        return;
      }

      const bands: [PlateKey, number, number, number][] = [
        ["far", frame.horizonY - frame.height * 0.06, frame.height * 0.3, 0.4],
        ["mid", frame.groundY - frame.height * 0.14, frame.height * 0.34, 0.7],
        ["near", frame.groundY - frame.height * 0.06, frame.height * 0.4, 1],
      ];
      for (const [key, top, height, depth] of bands) {
        const image = images.get(key);
        if (image) drawPlate(ctx, frame, image, top, height, depth);
      }
    },
  };
}
