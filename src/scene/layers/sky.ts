import { mulberry32, clamp, smoothstep } from "../noise";
import { css, mix, scale, type RGB } from "../palette";
import type { Frame, Layer } from "../types";

type Star = { x: number; y: number; size: number; hue: number; phase: number };
type Puff = { dx: number; dy: number; r: number };
type Cloud = { x: number; y: number; scale: number; depth: number; puffs: Puff[] };

const STAR_SEED = 20241109;

/** Sky dome: gradient, stars, moon, sun, clouds and the haze above the ridge. */
export function createSkyLayer(): Layer {
  let stars: Star[] = [];
  let clouds: Cloud[] = [];
  let width = 0;
  let height = 0;

  function buildStars(frame: Frame) {
    const random = mulberry32(STAR_SEED);
    const count =
      frame.quality === "low" ? 130 : frame.quality === "medium" ? 280 : 460;
    stars = Array.from({ length: count }, () => ({
      x: random() * frame.width,
      y: random() ** 1.6 * frame.horizonY,
      size: 0.4 + random() ** 3 * 1.5,
      hue: random(),
      phase: random() * Math.PI * 2,
    }));
  }

  function buildClouds(frame: Frame) {
    const random = mulberry32(STAR_SEED + 7);
    const count =
      frame.quality === "low" ? 5 : frame.quality === "medium" ? 9 : 14;
    clouds = Array.from({ length: count }, () => {
      const depth = 0.35 + random() * 0.65;
      const puffCount = 4 + Math.floor(random() * 5);
      return {
        x: random() * frame.width * 1.4 - frame.width * 0.2,
        y: frame.horizonY * (0.12 + random() * 0.62),
        scale: (0.6 + random() * 0.9) * (0.6 + depth * 0.7),
        depth,
        puffs: Array.from({ length: puffCount }, (_, i) => ({
          dx: (i - puffCount / 2) * (26 + random() * 22),
          dy: (random() - 0.5) * 20,
          r: 30 + random() * 46,
        })),
      };
    });
  }

  function drawStars(ctx: CanvasRenderingContext2D, frame: Frame) {
    const visibility = frame.lighting.starVisibility;
    if (visibility <= 0.02) return;

    // Milky Way: a soft diagonal band of unresolved starlight.
    if (frame.quality !== "low" && visibility > 0.35) {
      ctx.save();
      ctx.globalAlpha = visibility * 0.16;
      ctx.translate(frame.width * 0.66, frame.horizonY * 0.2);
      ctx.rotate(-0.5);
      const band = ctx.createLinearGradient(0, -frame.height * 0.4, 0, frame.height * 0.4);
      band.addColorStop(0, "rgba(150,168,220,0)");
      band.addColorStop(0.5, "rgba(186,196,236,0.75)");
      band.addColorStop(1, "rgba(150,168,220,0)");
      ctx.fillStyle = band;
      ctx.fillRect(-frame.width, -frame.height * 0.4, frame.width * 2, frame.height * 0.8);
      ctx.restore();
    }

    for (const star of stars) {
      // Stars near the horizon are dimmed by the thicker air.
      const extinction = smoothstep(frame.horizonY, frame.horizonY * 0.35, star.y);
      const twinkle =
        0.72 + 0.28 * Math.sin(frame.time * (0.8 + star.hue * 2.2) + star.phase);
      const alpha = visibility * extinction * twinkle * (0.35 + star.size * 0.42);
      if (alpha <= 0.01) continue;
      const tint: RGB =
        star.hue > 0.75 ? [198, 212, 255] : star.hue < 0.2 ? [255, 226, 202] : [244, 246, 255];
      ctx.fillStyle = css(tint, clamp(alpha));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawMoon(ctx: CanvasRenderingContext2D, frame: Frame) {
    const { moonScreen, moon, lighting } = frame;
    if (moon.altitude < -0.08) return;
    const visible =
      smoothstep(-0.05, 0.12, moon.altitude) * (1 - lighting.dayFactor * 0.72);
    if (visible <= 0.02) return;

    const radius = Math.max(11, frame.width * 0.014);
    ctx.save();
    ctx.globalAlpha = visible;

    // Halo — wider and stronger through cloud or humid air.
    const haloRadius =
      radius * (5 + 9 * frame.weather.cloudCover + 6 * lighting.hazeDensity);
    const halo = ctx.createRadialGradient(
      moonScreen.x, moonScreen.y, radius * 0.6,
      moonScreen.x, moonScreen.y, haloRadius,
    );
    halo.addColorStop(0, css(lighting.moonColor, 0.3 * moon.illumination));
    halo.addColorStop(1, css(lighting.moonColor, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(moonScreen.x, moonScreen.y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // Earthshine: the unlit disc is barely visible against the sky.
    const shadowColor = mix(scale(lighting.zenith, 1.25), lighting.moonColor, 0.18);
    ctx.fillStyle = css(shadowColor, 0.7);
    ctx.beginPath();
    ctx.arc(moonScreen.x, moonScreen.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // The lit crescent: the outer limb plus the terminator ellipse, whose
    // width is the signed illuminated fraction.
    const waxing = moon.phase < 0.5;
    const terminator = radius * (2 * moon.illumination - 1);
    ctx.fillStyle = css([238, 240, 234], 0.96);
    ctx.beginPath();
    if (waxing) {
      ctx.arc(moonScreen.x, moonScreen.y, radius, -Math.PI / 2, Math.PI / 2, false);
      ctx.ellipse(
        moonScreen.x, moonScreen.y, Math.abs(terminator), radius, 0,
        Math.PI / 2, -Math.PI / 2, terminator < 0,
      );
    } else {
      ctx.arc(moonScreen.x, moonScreen.y, radius, Math.PI / 2, -Math.PI / 2, false);
      ctx.ellipse(
        moonScreen.x, moonScreen.y, Math.abs(terminator), radius, 0,
        -Math.PI / 2, Math.PI / 2, terminator < 0,
      );
    }
    ctx.closePath();
    ctx.fill();

    // Maria — faint dark patches so the disc is not a flat circle.
    ctx.save();
    ctx.beginPath();
    ctx.arc(moonScreen.x, moonScreen.y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "rgba(150,155,160,0.28)";
    ctx.beginPath();
    ctx.arc(moonScreen.x - radius * 0.3, moonScreen.y - radius * 0.2, radius * 0.34, 0, Math.PI * 2);
    ctx.arc(moonScreen.x + radius * 0.28, moonScreen.y + radius * 0.3, radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawSun(ctx: CanvasRenderingContext2D, frame: Frame) {
    const { sunScreen, lighting, sun } = frame;
    if (sun.altitude < -0.16) return;
    const alpha =
      smoothstep(-0.14, 0.02, sun.altitude) * (1 - 0.75 * frame.weather.cloudCover);
    if (alpha <= 0.02) return;

    const radius = Math.max(10, frame.width * 0.011);
    const glowRadius = radius * (12 + 20 * lighting.goldenFactor);

    ctx.save();
    // The sun adds light rather than painting over the sky.
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(
      sunScreen.x, sunScreen.y, radius * 0.3,
      sunScreen.x, sunScreen.y, glowRadius,
    );
    glow.addColorStop(0, css(lighting.sunColor, 0.55 * alpha));
    glow.addColorStop(0.18, css(lighting.sunColor, 0.2 * alpha));
    glow.addColorStop(1, css(lighting.sunColor, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunScreen.x, sunScreen.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(
      sunScreen.x, sunScreen.y, 0, sunScreen.x, sunScreen.y, radius * 2.2,
    );
    core.addColorStop(0, css(mix(lighting.sunColor, [255, 255, 252], 0.8), alpha));
    core.addColorStop(0.45, css(mix(lighting.sunColor, [255, 255, 250], 0.5), alpha * 0.75));
    core.addColorStop(1, css(lighting.sunColor, 0));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(sunScreen.x, sunScreen.y, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawClouds(ctx: CanvasRenderingContext2D, frame: Frame) {
    const cover = clamp(frame.weather.cloudCover);
    const active = Math.round(clouds.length * clamp(0.12 + cover * 1.15, 0, 1));
    if (active === 0) return;

    const { lighting } = frame;
    const litSide = Math.sign(frame.sunScreen.x - frame.width / 2) || 1;
    const span = frame.width * 1.8;

    for (let i = 0; i < active; i++) {
      const cloud = clouds[i];
      // Advection: distant clouds crawl, near clouds race.
      const drift = frame.time * frame.wind.speed * 2.6 * (0.35 + cloud.depth);
      const x = (((cloud.x + drift) % span) + span) % span - frame.width * 0.4;
      const y = cloud.y;

      const shade = 0.5 + 0.5 * lighting.dayFactor;
      const bodyColor = mix(
        scale(lighting.horizon, 0.55 + 0.25 * shade),
        [232, 234, 238],
        0.35 * lighting.dayFactor,
      );
      const litColor = mix(bodyColor, lighting.sunColor, 0.4 * lighting.sunIntensity);
      const alpha = clamp((0.16 + cover * 0.6) * (0.55 + cloud.depth * 0.55));

      for (const puff of cloud.puffs) {
        const px = x + puff.dx * cloud.scale;
        const py = y + puff.dy * cloud.scale;
        const r = puff.r * cloud.scale;
        const gradient = ctx.createRadialGradient(
          px + r * 0.3 * litSide, py - r * 0.35, r * 0.1,
          px, py, r,
        );
        gradient.addColorStop(0, css(litColor, alpha));
        gradient.addColorStop(0.55, css(bodyColor, alpha * 0.72));
        gradient.addColorStop(1, css(bodyColor, 0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return {
    name: "sky",
    resize(frame) {
      width = frame.width;
      height = frame.height;
      buildStars(frame);
      buildClouds(frame);
    },
    draw(ctx, frame) {
      if (width !== frame.width || height !== frame.height) {
        width = frame.width;
        height = frame.height;
        buildStars(frame);
        buildClouds(frame);
      }

      const { lighting } = frame;
      const sky = ctx.createLinearGradient(0, 0, 0, frame.horizonY * 1.08);
      sky.addColorStop(0, css(lighting.zenith));
      sky.addColorStop(0.62, css(mix(lighting.zenith, lighting.horizon, 0.55)));
      sky.addColorStop(1, css(lighting.horizon));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, frame.width, frame.horizonY * 1.08);

      drawStars(ctx, frame);
      drawMoon(ctx, frame);
      drawSun(ctx, frame);
      drawClouds(ctx, frame);

      // Warm band where the sun meets the ridge line.
      if (lighting.sunIntensity > 0.01 || lighting.goldenFactor > 0.01) {
        const bandHeight = frame.horizonY * 0.45;
        const band = ctx.createLinearGradient(0, frame.horizonY - bandHeight, 0, frame.horizonY);
        band.addColorStop(0, css(lighting.sunColor, 0));
        band.addColorStop(1, css(lighting.sunColor, 0.16 + 0.3 * lighting.goldenFactor));
        ctx.fillStyle = band;
        ctx.fillRect(0, frame.horizonY - bandHeight, frame.width, bandHeight);
      }

      // Aerial haze thickens toward the horizon.
      const hazeTop = frame.horizonY - frame.height * 0.24;
      const haze = ctx.createLinearGradient(0, hazeTop, 0, frame.horizonY);
      haze.addColorStop(0, css(lighting.hazeColor, 0));
      haze.addColorStop(1, css(lighting.hazeColor, lighting.hazeDensity * 0.55));
      ctx.fillStyle = haze;
      ctx.fillRect(0, hazeTop, frame.width, frame.height * 0.24);
    },
  };
}
