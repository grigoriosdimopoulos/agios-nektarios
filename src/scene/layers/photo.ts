import { clamp, mulberry32, smoothstep } from "../noise";
import { css, mix, scale, type RGB } from "../palette";
import { HOUSE_LIGHTS, PHOTO_PLATES } from "../photoScene";
import type { Frame, Layer } from "../types";

type Band = "ridge" | "forest";

/** Where each plate sits: overscan, and how far its base is below the horizon. */
const LAYOUT: Record<Band, { overscan: number; baseOffset: number }> = {
  ridge: { overscan: 1.06, baseOffset: 0.17 },
  // Generously overscanned so the wood reaches up behind the village and no
  // drawn ground is left showing between the two plates.
  forest: { overscan: 1.9, baseOffset: 0.42 },
};

/**
 * The photographic backdrop: the association's own panorama of the settlement,
 * cut into a ridge plate and a forest plate with the sky removed, then lit by
 * the same engine that lights everything else — gold at sunset, blue at dusk,
 * white under snow, and with the windows of the real houses coming on at night.
 */
export function createPhotoLayer(band: Band): Layer {
  const plate = PHOTO_PLATES[band];
  const image = new Image();
  image.src = plate.src;

  // The plate is graded on its own offscreen canvas so the tints land on the
  // photograph's pixels only, never on the live sky showing through behind it.
  const offscreen = document.createElement("canvas");
  const octx = offscreen.getContext("2d");
  let gradedKey = "";
  let gradedAt = 0;

  const random = mulberry32(4711);
  // Each house keeps its own evening habits for the life of the page.
  const schedule = HOUSE_LIGHTS.map(() => ({
    offset: random(),
    stamina: random(),
    warmth: random(),
  }));

  function geometry(frame: Frame) {
    const layout = LAYOUT[band];
    const drawWidth = frame.width * layout.overscan;
    const drawHeight = drawWidth / plate.aspect;
    const left = (frame.width - drawWidth) / 2;
    const bottom = frame.groundY + frame.height * layout.baseOffset;
    return { left, top: bottom - drawHeight, drawWidth, drawHeight };
  }

  /** Quantised lighting state — the grade is redone only when it moves. */
  function lightingKey(frame: Frame): string {
    const { lighting } = frame;
    const q = (value: number) => Math.round(value * 24);
    return [
      q(lighting.ambientIntensity),
      q(lighting.sunIntensity),
      q(lighting.goldenFactor),
      q(lighting.moonIntensity),
      q(lighting.hazeDensity),
      q(frame.snowCover),
      Math.round(lighting.sunColor[0]),
      Math.round(lighting.sunColor[2]),
    ].join(":");
  }

  function regrade(frame: Frame, box: ReturnType<typeof geometry>) {
    if (!octx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(box.drawWidth * dpr));
    const height = Math.max(1, Math.round(box.drawHeight * dpr));
    if (offscreen.width !== width || offscreen.height !== height) {
      offscreen.width = width;
      offscreen.height = height;
    }

    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, width, height);
    octx.drawImage(image, 0, 0, width, height);

    const { lighting } = frame;
    // The photograph was taken in flat daylight; everything else is added on
    // top of it. source-atop keeps the tints inside the plate's own alpha.
    octx.globalCompositeOperation = "source-atop";

    // Night has to darken the photograph, not wash it out: a dark, slightly
    // blue veil at high opacity leaves only a moonlit silhouette.
    const darkness = clamp(1 - lighting.ambientIntensity);
    const veil = mix(
      scale(lighting.ambient, 0.3),
      lighting.moonColor,
      0.3 * lighting.moonIntensity,
    );
    octx.fillStyle = css(veil, Math.min(0.86, darkness * 0.92));
    octx.fillRect(0, 0, width, height);

    if (lighting.sunIntensity > 0.02 || lighting.goldenFactor > 0.02) {
      octx.fillStyle = css(
        lighting.sunColor,
        0.08 * lighting.sunIntensity + 0.24 * lighting.goldenFactor,
      );
      octx.fillRect(0, 0, width, height);
    }

    if (lighting.moonIntensity > 0.03) {
      octx.fillStyle = css(lighting.moonColor, 0.12 * lighting.moonIntensity);
      octx.fillRect(0, 0, width, height);
    }

    if (frame.snowCover > 0.02) {
      octx.fillStyle = css([232, 238, 248], frame.snowCover * 0.42);
      octx.fillRect(0, 0, width, height);
    }

    // Aerial perspective: the ridge sits further away than the wood in front.
    const distance = band === "ridge" ? 1 : 0.35;
    octx.fillStyle = css(lighting.hazeColor, lighting.hazeDensity * 0.45 * distance);
    octx.fillRect(0, 0, width, height);

    octx.globalCompositeOperation = "source-over";
  }

  function drawHouseLights(ctx: CanvasRenderingContext2D, frame: Frame, box: ReturnType<typeof geometry>) {
    const night = frame.lighting.artificialLight;
    if (night <= 0.03) return;

    const hour = frame.now.getHours() + frame.now.getMinutes() / 60;
    const radius = Math.max(1.4, frame.width * 0.0016);

    for (let i = 0; i < HOUSE_LIGHTS.length; i++) {
      const light = HOUSE_LIGHTS[i];
      const habit = schedule[i];

      const evening = smoothstep(16.5 + habit.offset, 19 + habit.offset, hour);
      const late =
        hour >= 22
          ? 1 - smoothstep(22 + habit.stamina * 2.5, 24.5 + habit.stamina * 2, hour)
          : 1;
      const earlyMorning =
        hour < 8 ? smoothstep(5.2 + habit.offset * 1.5, 7, hour) * 0.75 : 0;
      const glow = clamp(Math.max(evening * late, earlyMorning) * night);
      if (glow < 0.04) continue;

      const x = box.left + light.x * box.drawWidth;
      const y = box.top + light.y * box.drawHeight;
      const warm: RGB = habit.warmth > 0.85 ? [188, 214, 255] : [255, 196, 116];

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 9);
      halo.addColorStop(0, css(warm, 0.5 * glow));
      halo.addColorStop(1, css(warm, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, radius * 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = css(mix(warm, [255, 255, 240], 0.4), 0.9 * glow);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return {
    name: `photo-${band}`,
    draw(ctx, frame) {
      if (!image.complete || image.naturalWidth === 0 || !octx) return;

      const box = geometry(frame);
      const key = `${Math.round(box.drawWidth)}x${Math.round(box.drawHeight)}|${lightingKey(frame)}`;
      const now = performance.now();
      if (gradedKey === "" || (key !== gradedKey && now - gradedAt > 400)) {
        regrade(frame, box);
        gradedKey = key;
        gradedAt = now;
      }

      ctx.drawImage(offscreen, box.left, box.top, box.drawWidth, box.drawHeight);
      if (band === "ridge") drawHouseLights(ctx, frame, box);
    },
  };
}
