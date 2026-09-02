import { mulberry32 } from "../noise";
import type { Layer } from "../types";

/**
 * The camera pass.
 *
 * Everything above this layer is a photograph plus light. This pass makes the
 * whole frame behave like one exposure rather than a photo with things drawn
 * on top of it: highlights bloom, the image carries grain, and the corners
 * fall off. It is the difference between a picture and a rendering.
 */
export function createCameraLayer(): Layer {
  // Two successive downsamples give a wide, cheap glow. A full-size
  // ctx.filter blur looks the same and costs an order of magnitude more.
  const bloom = typeof document === "undefined" ? null : document.createElement("canvas");
  const bloomCtx = bloom?.getContext("2d") ?? null;
  const bloomSmall = typeof document === "undefined" ? null : document.createElement("canvas");
  const bloomSmallCtx = bloomSmall?.getContext("2d") ?? null;
  let frameIndex = 0;

  const grain = typeof document === "undefined" ? null : document.createElement("canvas");
  let grainPattern: CanvasPattern | null = null;

  function buildGrain(ctx: CanvasRenderingContext2D) {
    if (!grain) return;
    const size = 128;
    grain.width = size;
    grain.height = size;
    const gctx = grain.getContext("2d");
    if (!gctx) return;

    const image = gctx.createImageData(size, size);
    const random = mulberry32(20261109);
    for (let i = 0; i < image.data.length; i += 4) {
      // Monochrome grain: real film grain has no colour of its own.
      const value = 110 + random() * 90;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
    gctx.putImageData(image, 0, 0);
    grainPattern = ctx.createPattern(grain, "repeat");
  }

  return {
    name: "camera",
    draw(ctx, frame) {
      const source = ctx.canvas;

      // ── Bloom ────────────────────────────────────────────────────────────
      // Downsample, square the values twice to isolate highlights, blur, and
      // add back. Sunlight, window lamps and fireworks glow into the air the
      // way they do in a lens.
      if (bloom && bloomCtx && bloomSmall && bloomSmallCtx && frame.quality !== "low") {
        const w = Math.max(1, Math.round(frame.width / 6));
        const h = Math.max(1, Math.round(frame.height / 6));
        if (bloom.width !== w || bloom.height !== h) {
          bloom.width = w;
          bloom.height = h;
          bloomSmall.width = Math.max(1, Math.round(w / 3));
          bloomSmall.height = Math.max(1, Math.round(h / 3));
        }

        bloomCtx.globalCompositeOperation = "source-over";
        bloomCtx.globalAlpha = 1;
        bloomCtx.clearRect(0, 0, w, h);
        bloomCtx.drawImage(source, 0, 0, w, h);
        // x² then x⁴ — midtones fall away, highlights survive.
        bloomCtx.globalCompositeOperation = "multiply";
        bloomCtx.drawImage(bloom, 0, 0);
        bloomCtx.drawImage(bloom, 0, 0);

        // Second downsample, then a smoothed upscale: that is the blur.
        bloomSmallCtx.globalCompositeOperation = "source-over";
        bloomSmallCtx.clearRect(0, 0, bloomSmall.width, bloomSmall.height);
        bloomSmallCtx.drawImage(bloom, 0, 0, bloomSmall.width, bloomSmall.height);

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.55;
        ctx.drawImage(bloomSmall, 0, 0, frame.width, frame.height);
        ctx.restore();
      }

      // ── Vignette ─────────────────────────────────────────────────────────
      const dark = 1 - frame.lighting.dayFactor;
      const vignette = ctx.createRadialGradient(
        frame.width / 2, frame.height * 0.46, frame.height * 0.3,
        frame.width / 2, frame.height * 0.5, frame.height * 0.98,
      );
      vignette.addColorStop(0, "rgba(3,4,6,0)");
      vignette.addColorStop(1, `rgba(3,4,6,${(0.2 + 0.24 * dark).toFixed(3)})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, frame.width, frame.height);

      // ── Grain ────────────────────────────────────────────────────────────
      // Photographs are never clean, and grain is what binds drawn light and
      // photographed pixels into a single image.
      frameIndex++;
      if (!grainPattern) buildGrain(ctx);
      // Grain is a full-screen blend; at 30 Hz it still reads as film and
      // costs half as much.
      if (grainPattern && frameIndex % 2 === 0) {
        ctx.save();
        ctx.globalCompositeOperation = "overlay";
        // Grain rises in the shadows, exactly as it does at high ISO.
        ctx.globalAlpha = 0.05 + 0.09 * dark;
        ctx.translate(
          Math.floor(Math.random() * 128) - 64,
          Math.floor(Math.random() * 128) - 64,
        );
        ctx.fillStyle = grainPattern;
        ctx.fillRect(-128, -128, frame.width + 256, frame.height + 256);
        ctx.restore();
      }
    },
  };
}
