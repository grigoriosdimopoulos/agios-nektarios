import { clamp, mulberry32, smoothstep } from "../noise";
import { css, mix, scale, type RGB } from "../palette";
import type { Frame, Layer } from "../types";

type Window = {
  dx: number;
  dy: number;
  w: number;
  h: number;
  /** How late into the night this window stays lit, 0–1. */
  stamina: number;
  /** Random offset so windows do not switch on together. */
  offset: number;
  /** Set for one window per house: a television flickering. */
  television: boolean;
};

type House = {
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  wall: RGB;
  roof: RGB;
  chimney: { dx: number; h: number } | null;
  windows: Window[];
};

type Car = {
  /** 0–1 along the road. */
  t: number;
  speed: number;
  direction: 1 | -1;
  color: RGB;
};

type Smoke = { x: number; y: number; vx: number; vy: number; r: number; life: number };

const VILLAGE_SEED = 1112;

/** Houses, the church, the road and its traffic. */
export function createVillageLayer(): Layer {
  let houses: House[] = [];
  let cars: Car[] = [];
  let smoke: Smoke[] = [];
  let church = { x: 0, y: 0, scale: 1 };
  let roadY = 0;
  let width = 0;
  let height = 0;

  function roadPoint(frame: Frame, t: number) {
    // A track that climbs from the lower left and disappears behind the hamlet.
    const x = -frame.width * 0.12 + t * frame.width * 1.24;
    const y =
      roadY +
      Math.sin(t * Math.PI * 1.15) * frame.height * 0.05 -
      t * frame.height * 0.045;
    return { x, y };
  }

  function build(frame: Frame) {
    const random = mulberry32(VILLAGE_SEED);
    roadY = frame.groundY + frame.height * 0.075;

    const count =
      frame.quality === "low" ? 7 : frame.quality === "medium" ? 11 : 15;
    const centre = frame.width * (0.34 + random() * 0.22);

    houses = Array.from({ length: count }, () => {
      const depth = random();
      const w = frame.height * (0.022 + depth * 0.036);
      const h = w * (0.6 + random() * 0.34);
      // A hamlet: houses cluster around the church, thinning out with distance.
      const spread = (random() + random() + random() - 1.5) * frame.width * 0.42;
      const x = centre + spread;
      const y =
        frame.groundY +
        frame.height * (0.002 + depth * 0.05) +
        Math.sin(x * 0.004) * frame.height * 0.008;

      const cols = Math.max(2, Math.round(w / (frame.height * 0.017)));
      const rows = h > w * 0.8 ? 2 : 1;
      const windows: Window[] = [];
      const televisionIndex = Math.floor(random() * cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ww = w / (cols * 2.4);
          const wh = ww * 1.35;
          windows.push({
            dx: ((c + 0.5) / cols) * w - w / 2 - ww / 2,
            dy: -h + ((r + 0.55) / (rows + 0.35)) * h * 0.86,
            w: ww,
            h: wh,
            stamina: random(),
            offset: random(),
            television: windows.length === televisionIndex && random() < 0.5,
          });
        }
      }

      const whitewash = 0.55 + random() * 0.45;
      return {
        x,
        y,
        w,
        h,
        depth,
        wall: [206 * whitewash + 30, 200 * whitewash + 28, 188 * whitewash + 26] as RGB,
        roof: [120 + random() * 26, 62 + random() * 18, 48 + random() * 14] as RGB,
        chimney: random() < 0.75 ? { dx: (random() - 0.5) * w * 0.5, h: h * 0.28 } : null,
        windows,
      };
    }).sort((a, b) => a.y - b.y);

    church = {
      x: centre,
      y: frame.groundY + frame.height * 0.035,
      scale: clamp(frame.height / 900, 0.6, 1.5),
    };

    cars = Array.from({ length: frame.quality === "low" ? 1 : 3 }, () => ({
      t: random(),
      speed: 0.018 + random() * 0.02,
      direction: random() < 0.5 ? 1 : -1,
      color: [140 + random() * 90, 140 + random() * 80, 148 + random() * 80] as RGB,
    }));

    smoke = [];
  }

  function windowGlow(frame: Frame, window: Window): number {
    const night = frame.lighting.artificialLight;
    if (night <= 0.02) return 0;
    const hour = frame.now.getHours() + frame.now.getMinutes() / 60;
    // Everyone is up in the evening; only a few windows are lit after midnight.
    const evening = smoothstep(16.5 + window.offset, 19 + window.offset, hour);
    const late =
      hour >= 22
        ? 1 - smoothstep(22 + window.stamina * 2.5, 24.5 + window.stamina * 2, hour)
        : 1;
    const earlyMorning =
      hour < 8 ? smoothstep(5.2 + window.offset * 1.5, 7, hour) * 0.8 : 0;
    const lit = Math.max(evening * late, earlyMorning);
    return clamp(lit * night);
  }

  function drawHouse(ctx: CanvasRenderingContext2D, frame: Frame, house: House) {
    const { lighting } = frame;
    const light = 0.2 + 0.95 * lighting.ambientIntensity;
    const haze = clamp((1 - house.depth) * 0.28 * (0.5 + lighting.hazeDensity));

    const sunSide = frame.sunScreen.x < frame.width / 2 ? -1 : 1;
    const wallLit = mix(
      mix(scale(house.wall, light), lighting.sunColor, 0.22 * lighting.sunIntensity),
      lighting.hazeColor,
      haze,
    );
    const wallShade = scale(wallLit, 0.72);

    const x = house.x - house.w / 2;
    const y = house.y - house.h;

    // Two-tone walls give the block a lit and a shaded face.
    ctx.fillStyle = css(sunSide > 0 ? wallLit : wallShade);
    ctx.fillRect(x, y, house.w * 0.6, house.h);
    ctx.fillStyle = css(sunSide > 0 ? wallShade : wallLit);
    ctx.fillRect(x + house.w * 0.6, y, house.w * 0.4, house.h);

    // Pitched tile roof.
    const roofLit = mix(
      mix(scale(house.roof, light), lighting.sunColor, 0.24 * lighting.sunIntensity),
      lighting.hazeColor,
      haze,
    );
    const roofHeight = house.h * 0.42;
    ctx.fillStyle = css(roofLit);
    ctx.beginPath();
    ctx.moveTo(x - house.w * 0.06, y);
    ctx.lineTo(house.x, y - roofHeight);
    ctx.lineTo(x + house.w * 1.06, y);
    ctx.closePath();
    ctx.fill();

    if (frame.snowCover > 0.1) {
      ctx.fillStyle = css(mix([240, 244, 250], lighting.hazeColor, haze), clamp(frame.snowCover));
      ctx.beginPath();
      ctx.moveTo(x - house.w * 0.06, y);
      ctx.lineTo(house.x, y - roofHeight);
      ctx.lineTo(x + house.w * 1.06, y);
      ctx.lineTo(x + house.w * 1.06, y - roofHeight * 0.12);
      ctx.lineTo(house.x, y - roofHeight - roofHeight * 0.1);
      ctx.lineTo(x - house.w * 0.06, y - roofHeight * 0.12);
      ctx.closePath();
      ctx.fill();
    }

    if (house.chimney) {
      ctx.fillStyle = css(scale(roofLit, 0.85));
      ctx.fillRect(
        house.x + house.chimney.dx,
        y - roofHeight * 0.7 - house.chimney.h,
        house.w * 0.11,
        house.chimney.h + roofHeight * 0.7,
      );
    }

    for (const window of house.windows) {
      const glow = windowGlow(frame, window);
      const flicker = window.television
        ? 0.65 + 0.35 * Math.sin(frame.time * 9 + window.offset * 12)
        : 1;
      const warm: RGB = window.television ? [150, 186, 230] : [255, 196, 118];
      const dark = scale(wallShade, 0.45);
      const color = mix(dark, warm, glow * flicker);

      ctx.fillStyle = css(color);
      ctx.fillRect(house.x + window.dx, house.y + window.dy, window.w, window.h);

      if (glow > 0.08) {
        const spill = ctx.createRadialGradient(
          house.x + window.dx + window.w / 2, house.y + window.dy + window.h / 2, 0,
          house.x + window.dx + window.w / 2, house.y + window.dy + window.h / 2,
          window.w * 5,
        );
        spill.addColorStop(0, css(warm, 0.3 * glow * flicker));
        spill.addColorStop(1, css(warm, 0));
        ctx.fillStyle = spill;
        ctx.beginPath();
        ctx.arc(
          house.x + window.dx + window.w / 2,
          house.y + window.dy + window.h / 2,
          window.w * 5, 0, Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }

  function drawChurch(ctx: CanvasRenderingContext2D, frame: Frame) {
    const { lighting } = frame;
    const s = church.scale * frame.height * 0.07;
    const light = 0.24 + 0.92 * lighting.ambientIntensity;
    const stone = mix(
      mix(scale([216, 208, 192], light), lighting.sunColor, 0.2 * lighting.sunIntensity),
      lighting.hazeColor,
      0.12,
    );
    const roofColor = mix(scale([132, 78, 58], light), lighting.sunColor, 0.2 * lighting.sunIntensity);

    const x = church.x;
    const y = church.y;

    ctx.fillStyle = css(stone);
    ctx.fillRect(x - s * 0.9, y - s * 0.85, s * 1.8, s * 0.85);

    // Tiled roof over the three aisles.
    ctx.fillStyle = css(roofColor);
    ctx.beginPath();
    ctx.moveTo(x - s, y - s * 0.85);
    ctx.lineTo(x, y - s * 1.2);
    ctx.lineTo(x + s, y - s * 0.85);
    ctx.closePath();
    ctx.fill();

    // Dome and cross.
    ctx.fillStyle = css(scale(stone, 0.94));
    ctx.beginPath();
    ctx.arc(x, y - s * 1.2, s * 0.34, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = css(mix(stone, [255, 232, 190], 0.5 * lighting.artificialLight));
    ctx.lineWidth = Math.max(1, s * 0.045);
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.54);
    ctx.lineTo(x, y - s * 1.82);
    ctx.moveTo(x - s * 0.1, y - s * 1.72);
    ctx.lineTo(x + s * 0.1, y - s * 1.72);
    ctx.stroke();

    // Bell tower.
    ctx.fillStyle = css(stone);
    ctx.fillRect(x + s * 0.72, y - s * 1.45, s * 0.32, s * 1.45);
    ctx.fillStyle = css(roofColor);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.66, y - s * 1.45);
    ctx.lineTo(x + s * 0.88, y - s * 1.72);
    ctx.lineTo(x + s * 1.1, y - s * 1.45);
    ctx.closePath();
    ctx.fill();

    // The church is floodlit through the night.
    const glow = lighting.artificialLight;
    if (glow > 0.05) {
      const warm: RGB = [255, 206, 140];
      const halo = ctx.createRadialGradient(x, y - s * 0.6, 0, x, y - s * 0.6, s * 3.4);
      halo.addColorStop(0, css(warm, 0.16 * glow));
      halo.addColorStop(1, css(warm, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y - s * 0.6, s * 3.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = css(warm, 0.55 * glow);
      ctx.fillRect(x - s * 0.12, y - s * 0.55, s * 0.24, s * 0.34);
    }
  }

  function drawRoadAndCars(ctx: CanvasRenderingContext2D, frame: Frame) {
    const { lighting } = frame;
    const roadColor = mix(
      scale([48, 46, 46], 0.3 + 0.9 * lighting.ambientIntensity),
      [230, 236, 244],
      frame.snowCover * 0.55,
    );

    // The track narrows with distance, so it is drawn segment by segment.
    ctx.strokeStyle = css(roadColor, 0.9);
    ctx.lineCap = "round";
    const segments = 26;
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const a = roadPoint(frame, t0);
      const b = roadPoint(frame, t1);
      ctx.lineWidth = frame.height * (0.014 - t0 * 0.0105);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (const car of cars) {
      car.t += car.speed * frame.dt * car.direction;
      if (car.t > 1.05) car.t = -0.05;
      if (car.t < -0.05) car.t = 1.05;

      const progress = clamp(car.t, -0.05, 1.05);
      const point = roadPoint(frame, progress);
      // Perspective: a car far up the track is much smaller.
      const size = frame.height * (0.011 - clamp(progress, 0, 1) * 0.007);
      const night = lighting.artificialLight;

      // Headlight cone sweeping the road ahead.
      if (night > 0.08) {
        const ahead = car.direction;
        const reach = size * 7;
        const cone = ctx.createLinearGradient(
          point.x, point.y, point.x + ahead * reach, point.y,
        );
        cone.addColorStop(0, `rgba(255,236,190,${(0.18 * night).toFixed(3)})`);
        cone.addColorStop(1, "rgba(255,236,190,0)");
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y - size * 0.2);
        ctx.lineTo(point.x + ahead * reach, point.y - size * 1.1);
        ctx.lineTo(point.x + ahead * reach, point.y + size * 0.8);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = css(
        scale(car.color, 0.18 + 0.6 * lighting.ambientIntensity),
      );
      ctx.beginPath();
      ctx.roundRect(point.x - size, point.y - size * 0.9, size * 2, size * 0.9, size * 0.3);
      ctx.fill();

      if (night > 0.08) {
        ctx.fillStyle = `rgba(255,244,214,${(0.9 * night).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(point.x + car.direction * size * 0.9, point.y - size * 0.35, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,86,60,${(0.8 * night).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(point.x - car.direction * size * 0.9, point.y - size * 0.35, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function updateSmoke(frame: Frame) {
    const cold = frame.weather.temperature < 14 || frame.season === "winter";
    const evening = frame.lighting.artificialLight > 0.15;
    const chimneysLit = cold && (evening || frame.season === "winter");

    if (chimneysLit && smoke.length < (frame.quality === "low" ? 24 : 70)) {
      for (const house of houses) {
        if (!house.chimney || Math.random() > 0.02) continue;
        smoke.push({
          x: house.x + house.chimney.dx + house.w * 0.055,
          y: house.y - house.h - house.h * 0.42 * 0.7 - house.chimney.h,
          vx: 0,
          vy: -frame.height * 0.012,
          r: house.w * 0.09,
          life: 0,
        });
      }
    }

    for (let i = smoke.length - 1; i >= 0; i--) {
      const puff = smoke[i];
      puff.life += frame.dt;
      // Buoyancy plus wind shear — the plume leans downwind as it rises.
      puff.vx += (frame.wind.speed * 6 - puff.vx) * frame.dt * 0.7;
      puff.vy += -frame.height * 0.004 * frame.dt;
      puff.x += puff.vx * frame.dt;
      puff.y += puff.vy * frame.dt;
      puff.r += frame.height * 0.012 * frame.dt;
      if (puff.life > 7) smoke.splice(i, 1);
    }
  }

  function drawSmoke(ctx: CanvasRenderingContext2D, frame: Frame) {
    const base = mix(
      [150, 150, 152],
      frame.lighting.sunColor,
      0.25 * frame.lighting.sunIntensity,
    );
    for (const puff of smoke) {
      const alpha = clamp((1 - puff.life / 7) * 0.22);
      if (alpha <= 0.01) continue;
      const gradient = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.r);
      gradient.addColorStop(0, css(base, alpha));
      gradient.addColorStop(1, css(base, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return {
    name: "village",
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
      updateSmoke(frame);
    },
    draw(ctx, frame) {
      drawChurch(ctx, frame);
      for (const house of houses) drawHouse(ctx, frame, house);
      drawRoadAndCars(ctx, frame);
      drawSmoke(ctx, frame);
    },
  };
}
