import { clamp, mulberry32 } from "../noise";
import { css, mix, type RGB } from "../palette";
import { houseAnchors } from "../photoScene";
import type { Frame, Layer } from "../types";

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: RGB;
};

type Firework = { x: number; y: number; vy: number; fuse: number; color: RGB; launched: boolean };

type Candle = { x: number; y: number; drift: number; phase: number };

const GREEK_BLUE: RGB = [13, 94, 175];
const GREEK_WHITE: RGB = [244, 246, 248];
const HOLIDAY_SEED = 325;

/** National days, Christmas, New Year and Easter dress the scene. */
export function createHolidayLayer({ anchored = false } = {}): Layer {
  let sparks: Spark[] = [];
  let fireworks: Firework[] = [];
  let candles: Candle[] = [];
  let poles: { x: number; y: number; h: number }[] = [];
  let lightStrings: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let width = 0;
  let height = 0;
  let launchTimer = 0;

  function build(frame: Frame) {
    const random = mulberry32(HOLIDAY_SEED);

    if (anchored) {
      // Decorations belong on the houses in the photograph, at the scale those
      // houses actually are — not floating over the valley.
      const houses = houseAnchors(frame.width, frame.height, frame.groundY);
      const pick = (count: number) => {
        const step = Math.max(1, Math.floor(houses.length / count));
        return houses.filter((_, i) => i % step === 0).slice(0, count);
      };

      poles = pick(frame.quality === "low" ? 3 : 6).map((house) => ({
        x: house.x,
        y: house.y,
        h: frame.height * (0.024 + random() * 0.012),
      }));

      // A short string of lights along the eaves of a house.
      lightStrings = pick(frame.quality === "low" ? 6 : 14).map((house) => {
        const span = frame.width * (0.012 + random() * 0.012);
        return {
          x1: house.x - span / 2,
          y1: house.y,
          x2: house.x + span / 2,
          y2: house.y + (random() - 0.5) * frame.height * 0.002,
        };
      });

      const churchside = houses[Math.floor(houses.length / 2)] ?? {
        x: frame.width / 2,
        y: frame.groundY,
      };
      candles = Array.from({ length: frame.quality === "low" ? 10 : 24 }, () => ({
        x: churchside.x + (random() - 0.5) * frame.width * 0.09,
        y: churchside.y + (random() - 0.5) * frame.height * 0.012,
        drift: (random() - 0.5) * 0.25,
        phase: random() * Math.PI * 2,
      }));
    } else {
      poles = Array.from({ length: frame.quality === "low" ? 2 : 4 }, () => ({
        x: frame.width * (0.1 + random() * 0.8),
        y: frame.groundY + frame.height * (0.01 + random() * 0.03),
        h: frame.height * (0.09 + random() * 0.05),
      }));

      lightStrings = Array.from({ length: frame.quality === "low" ? 3 : 6 }, () => {
        const x1 = frame.width * random() * 0.9;
        return {
          x1,
          y1: frame.groundY + frame.height * (0.005 + random() * 0.03),
          x2: x1 + frame.width * (0.08 + random() * 0.12),
          y2: frame.groundY + frame.height * (0.005 + random() * 0.03),
        };
      });

      candles = Array.from({ length: frame.quality === "low" ? 12 : 30 }, () => ({
        x: frame.width * (0.3 + random() * 0.35),
        y: frame.groundY + frame.height * (0.02 + random() * 0.045),
        drift: (random() - 0.5) * 0.4,
        phase: random() * Math.PI * 2,
      }));
    }

    sparks = [];
    fireworks = [];
  }

  function drawFlag(ctx: CanvasRenderingContext2D, frame: Frame, pole: { x: number; y: number; h: number }) {
    const { lighting } = frame;
    const light = 0.3 + 0.9 * lighting.ambientIntensity;
    const flagW = pole.h * 0.62;
    const flagH = flagW * (2 / 3);
    const top = pole.y - pole.h;

    ctx.strokeStyle = css([180, 180, 176].map((c) => c * light) as RGB);
    ctx.lineWidth = Math.max(1, pole.h * 0.02);
    ctx.beginPath();
    ctx.moveTo(pole.x, pole.y);
    ctx.lineTo(pole.x, top);
    ctx.stroke();

    // The cloth: a travelling wave whose amplitude follows the wind.
    const amplitude = flagH * (0.06 + Math.abs(frame.wind.force) * 0.34);
    const speed = 2 + Math.abs(frame.wind.force) * 5;
    const columns = frame.quality === "low" ? 8 : 16;
    const stripeHeight = flagH / 9;

    for (let s = 0; s < 9; s++) {
      const color = s % 2 === 0 ? GREEK_BLUE : GREEK_WHITE;
      ctx.fillStyle = css(color.map((c) => c * light) as RGB);
      ctx.beginPath();
      for (let c = 0; c <= columns; c++) {
        const t = c / columns;
        const x = pole.x + t * flagW;
        const wave = Math.sin(t * 5 - frame.time * speed) * amplitude * t;
        const y = top + s * stripeHeight + wave;
        if (c === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let c = columns; c >= 0; c--) {
        const t = c / columns;
        const x = pole.x + t * flagW;
        const wave = Math.sin(t * 5 - frame.time * speed) * amplitude * t;
        ctx.lineTo(x, top + (s + 1) * stripeHeight + wave);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Canton with the white cross.
    const canton = stripeHeight * 5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pole.x, top, canton, canton);
    ctx.clip();
    ctx.fillStyle = css(GREEK_BLUE.map((c) => c * light) as RGB);
    ctx.fillRect(pole.x, top, canton, canton);
    ctx.fillStyle = css(GREEK_WHITE.map((c) => c * light) as RGB);
    ctx.fillRect(pole.x + canton * 0.4, top, canton * 0.2, canton);
    ctx.fillRect(pole.x, top + canton * 0.4, canton, canton * 0.2);
    ctx.restore();
  }

  function drawChristmas(ctx: CanvasRenderingContext2D, frame: Frame) {
    const glow = 0.25 + 0.75 * frame.lighting.artificialLight;
    const colors: RGB[] = [
      [255, 96, 80], [255, 208, 116], [120, 220, 150], [130, 176, 255], [246, 160, 230],
    ];

    for (const [index, string] of lightStrings.entries()) {
      const bulbs = anchored ? 6 : 12;
      ctx.strokeStyle = `rgba(40,40,44,${(0.5 * glow).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= bulbs; i++) {
        const t = i / bulbs;
        const x = string.x1 + (string.x2 - string.x1) * t;
        const sag = Math.sin(t * Math.PI) * frame.height * (anchored ? 0.002 : 0.012);
        const sway =
          Math.sin(frame.time * 1.2 + t * 3 + index) *
          frame.wind.force *
          frame.height * (anchored ? 0.0012 : 0.006);
        const y = string.y1 + (string.y2 - string.y1) * t + sag + sway;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let i = 0; i <= bulbs; i++) {
        const t = i / bulbs;
        const x = string.x1 + (string.x2 - string.x1) * t;
        const sag = Math.sin(t * Math.PI) * frame.height * (anchored ? 0.002 : 0.012);
        const sway =
          Math.sin(frame.time * 1.2 + t * 3 + index) *
          frame.wind.force *
          frame.height * (anchored ? 0.0012 : 0.006);
        const y = string.y1 + (string.y2 - string.y1) * t + sag + sway;
        const color = colors[(i + index) % colors.length];
        const twinkle = 0.55 + 0.45 * Math.sin(frame.time * 2.4 + i * 0.9 + index);
        const alpha = clamp(glow * twinkle);
        const radius = frame.height * (anchored ? 0.0013 : 0.0035);

        const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 6);
        halo.addColorStop(0, css(color, alpha * 0.55));
        halo.addColorStop(1, css(color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, radius * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = css(mix(color, [255, 255, 255], 0.35), alpha);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawCandles(ctx: CanvasRenderingContext2D, frame: Frame, presence: number) {
    if (presence <= 0.05) return;
    for (const candle of candles) {
      const flicker = 0.7 + 0.3 * Math.sin(frame.time * 6 + candle.phase);
      const lean = frame.wind.force * 0.35;
      const x = candle.x + Math.sin(frame.time * 0.4 + candle.phase) * candle.drift * frame.width * 0.01;
      const y = candle.y;
      const radius = frame.height * (anchored ? 0.006 : 0.02) * flicker;

      const halo = ctx.createRadialGradient(x, y, 0, x, y, radius);
      halo.addColorStop(0, `rgba(255,206,132,${(0.5 * presence * flicker).toFixed(3)})`);
      halo.addColorStop(1, "rgba(255,206,132,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,236,190,${(0.95 * presence).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(
        x + lean * frame.height * 0.004,
        y - frame.height * (anchored ? 0.0016 : 0.004),
        frame.height * (anchored ? 0.0007 : 0.0016),
        frame.height * (anchored ? 0.0016 : 0.004) * flicker,
        lean * 0.5, 0, Math.PI * 2,
      );
      ctx.fill();
    }
  }

  function updateFireworks(frame: Frame, active: boolean) {
    launchTimer -= frame.dt;
    if (active && launchTimer <= 0 && fireworks.length < 4) {
      launchTimer = 0.9 + Math.random() * 2.6;
      const hue = Math.random();
      fireworks.push({
        x: frame.width * (0.15 + Math.random() * 0.7),
        y: frame.groundY,
        vy: -frame.height * (0.45 + Math.random() * 0.22),
        fuse: 0.9 + Math.random() * 0.6,
        color:
          hue > 0.66 ? [255, 150, 90] : hue > 0.33 ? [140, 190, 255] : [255, 120, 170],
        launched: true,
      });
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
      const rocket = fireworks[i];
      rocket.y += rocket.vy * frame.dt;
      rocket.vy += frame.height * 0.3 * frame.dt;
      rocket.fuse -= frame.dt;
      if (rocket.fuse <= 0) {
        const count = frame.quality === "low" ? 24 : 54;
        for (let s = 0; s < count; s++) {
          const angle = (s / count) * Math.PI * 2 + Math.random() * 0.1;
          const speed = frame.height * (0.12 + Math.random() * 0.16);
          sparks.push({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 1.2 + Math.random() * 0.9,
            color: rocket.color,
          });
        }
        fireworks.splice(i, 1);
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      spark.life += frame.dt;
      // Gravity plus air drag, and the wind carries the embers sideways.
      spark.vy += frame.height * 0.32 * frame.dt;
      spark.vx += (frame.wind.speed * frame.height * 0.012 - spark.vx) * frame.dt * 0.7;
      spark.vx *= 1 - frame.dt * 0.55;
      spark.vy *= 1 - frame.dt * 0.35;
      spark.x += spark.vx * frame.dt;
      spark.y += spark.vy * frame.dt;
      if (spark.life > spark.maxLife) sparks.splice(i, 1);
    }
  }

  function drawFireworks(ctx: CanvasRenderingContext2D, frame: Frame) {
    for (const rocket of fireworks) {
      ctx.fillStyle = css(rocket.color, 0.9);
      ctx.beginPath();
      ctx.arc(rocket.x, rocket.y, frame.height * 0.0025, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const spark of sparks) {
      const fade = clamp(1 - spark.life / spark.maxLife);
      ctx.fillStyle = css(mix(spark.color, [255, 250, 235], 0.35 * fade), fade * 0.92);
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, frame.height * 0.002 * (0.4 + fade), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return {
    name: "holiday",
    resize(frame) {
      width = frame.width;
      height = frame.height;
      build(frame);
    },
    update(frame) {
      if (width !== frame.width || height !== frame.height) {
        width = frame.width;
        height = frame.height;
        build(frame);
      }

      const hour = frame.now.getHours();
      const newYearMidnight =
        frame.holiday === "newyear" && (hour >= 23 || hour < 1);
      const easterMidnight = frame.resurrectionNight;
      updateFireworks(frame, newYearMidnight || easterMidnight);
    },
    draw(ctx, frame) {
      switch (frame.holiday) {
        case "independence":
        case "ohi":
          for (const pole of poles) drawFlag(ctx, frame, pole);
          break;
        case "christmas":
          drawChristmas(ctx, frame);
          break;
        case "newyear":
          drawChristmas(ctx, frame);
          drawFireworks(ctx, frame);
          break;
        case "easter":
          drawCandles(
            ctx,
            frame,
            frame.resurrectionNight ? 1 : frame.lighting.artificialLight * 0.5,
          );
          drawFireworks(ctx, frame);
          break;
        case "patron":
          drawCandles(ctx, frame, frame.lighting.artificialLight * 0.75);
          break;
        default:
          break;
      }
    },
  };
}
