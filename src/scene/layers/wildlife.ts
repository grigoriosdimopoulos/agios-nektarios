import { clamp, mulberry32, smoothstep } from "../noise";
import { css, mix, scale, type RGB } from "../palette";
import type { Frame, Layer } from "../types";

type Boid = { x: number; y: number; vx: number; vy: number; flap: number };

type Owl = {
  perchX: number;
  perchY: number;
  x: number;
  y: number;
  /** −1 flying left, 1 flying right, 0 perched. */
  glide: number;
  glideTimer: number;
  headTurn: number;
  headTarget: number;
  blink: number;
};

type Flutterer = { x: number; y: number; phase: number; speed: number; hue: number };

const WILDLIFE_SEED = 9111;

/** Birds at first light, owls after dark, bats at dusk, butterflies in spring. */
export function createWildlifeLayer(): Layer {
  let flock: Boid[] = [];
  let owls: Owl[] = [];
  let bats: Boid[] = [];
  let flutterers: Flutterer[] = [];
  let width = 0;
  let height = 0;
  let flockTimer = 0;
  let flockActive = false;

  function build(frame: Frame) {
    const random = mulberry32(WILDLIFE_SEED);
    const flockSize =
      frame.quality === "low" ? 5 : frame.quality === "medium" ? 9 : 14;

    flock = Array.from({ length: flockSize }, () => ({
      x: -frame.width * 0.2 + random() * frame.width * 0.3,
      y: frame.horizonY * (0.25 + random() * 0.4),
      vx: frame.width * 0.05,
      vy: 0,
      flap: random() * Math.PI * 2,
    }));

    // Owls perch in the framing trees at the edges of the frame, never in
    // mid-air over the village.
    owls = Array.from({ length: frame.quality === "low" ? 1 : 2 }, (_, index) => {
      const perchX =
        index % 2 === 0
          ? frame.width * (0.83 + random() * 0.08)
          : frame.width * (0.02 + random() * 0.07);
      const perchY = frame.groundY - frame.height * (0.03 + random() * 0.05);
      return {
        perchX,
        perchY,
        x: perchX,
        y: perchY,
        glide: 0,
        glideTimer: 20 + random() * 45,
        headTurn: 0,
        headTarget: 0,
        blink: 0,
      };
    });

    bats = Array.from({ length: frame.quality === "low" ? 3 : 7 }, () => ({
      x: random() * frame.width,
      y: frame.horizonY * (0.5 + random() * 0.4),
      vx: (random() - 0.5) * frame.width * 0.12,
      vy: (random() - 0.5) * frame.height * 0.05,
      flap: random() * Math.PI * 2,
    }));

    flutterers = Array.from({ length: frame.quality === "low" ? 4 : 9 }, () => ({
      x: random() * frame.width,
      y: frame.groundY - frame.height * random() * 0.09,
      phase: random() * Math.PI * 2,
      speed: 0.4 + random() * 0.9,
      hue: random(),
    }));
  }

  /** Birds fly at dawn and, less busily, through the day. */
  function birdActivity(frame: Frame): number {
    const hour = frame.now.getHours() + frame.now.getMinutes() / 60;
    const dawnChorus = smoothstep(5, 7, hour) * (1 - smoothstep(8.5, 11, hour));
    const daytime = frame.lighting.dayFactor * 0.35;
    const dusk = smoothstep(17, 19, hour) * (1 - smoothstep(19.5, 21, hour)) * 0.5;
    return clamp(Math.max(dawnChorus, daytime, dusk) * (1 - frame.weather.cloudCover * 0.3));
  }

  function updateFlock(frame: Frame, activity: number) {
    flockTimer -= frame.dt;
    if (flockTimer <= 0) {
      flockTimer = 18 + Math.random() * 40;
      flockActive = Math.random() < activity;
      if (flockActive) {
        const fromLeft = Math.random() < 0.5;
        const y = frame.horizonY * (0.2 + Math.random() * 0.45);
        for (const bird of flock) {
          bird.x = fromLeft ? -frame.width * 0.15 - Math.random() * frame.width * 0.2 : frame.width * 1.15 + Math.random() * frame.width * 0.2;
          bird.y = y + (Math.random() - 0.5) * frame.height * 0.06;
          bird.vx = (fromLeft ? 1 : -1) * frame.width * (0.045 + Math.random() * 0.03);
          bird.vy = 0;
        }
      }
    }
    if (!flockActive) return;

    // Classic boids: separation, alignment, cohesion, plus a wind push.
    let cx = 0;
    let cy = 0;
    let avx = 0;
    let avy = 0;
    for (const bird of flock) {
      cx += bird.x;
      cy += bird.y;
      avx += bird.vx;
      avy += bird.vy;
    }
    cx /= flock.length;
    cy /= flock.length;
    avx /= flock.length;
    avy /= flock.length;

    const windPush = frame.wind.speed * frame.width * 0.004;
    let offScreen = 0;

    for (const bird of flock) {
      let sx = 0;
      let sy = 0;
      for (const other of flock) {
        if (other === bird) continue;
        const dx = bird.x - other.x;
        const dy = bird.y - other.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < frame.width * 0.03) {
          sx += (dx / distance) * frame.width * 0.06;
          sy += (dy / distance) * frame.width * 0.06;
        }
      }

      bird.vx += ((cx - bird.x) * 0.35 + (avx - bird.vx) * 0.9 + sx) * frame.dt + windPush * frame.dt;
      bird.vy += ((cy - bird.y) * 0.35 + (avy - bird.vy) * 0.9 + sy) * frame.dt;
      bird.vy += Math.sin(frame.time * 0.8 + bird.flap) * frame.height * 0.012 * frame.dt;

      const speed = Math.hypot(bird.vx, bird.vy);
      const target = frame.width * 0.06;
      if (speed > 0.001) {
        bird.vx = (bird.vx / speed) * target;
        bird.vy = (bird.vy / speed) * target;
      }

      bird.x += bird.vx * frame.dt;
      bird.y += bird.vy * frame.dt;
      bird.flap += frame.dt * (7 + Math.abs(bird.vy) * 0.02);

      if (bird.x < -frame.width * 0.3 || bird.x > frame.width * 1.3) offScreen++;
    }

    if (offScreen === flock.length) flockActive = false;
  }

  function drawBirds(ctx: CanvasRenderingContext2D, frame: Frame) {
    if (!flockActive) return;
    const size = Math.max(3, frame.width * 0.005);
    ctx.strokeStyle = css(
      mix([28, 30, 34], frame.lighting.hazeColor, 0.3),
      0.75 * (0.3 + frame.lighting.dayFactor),
    );
    ctx.lineWidth = Math.max(1, size * 0.2);
    ctx.lineCap = "round";

    for (const bird of flock) {
      const beat = Math.sin(bird.flap);
      ctx.beginPath();
      ctx.moveTo(bird.x - size, bird.y - beat * size * 0.55);
      ctx.quadraticCurveTo(bird.x, bird.y + size * 0.2, bird.x + size, bird.y - beat * size * 0.55);
      ctx.stroke();
    }
  }

  function updateOwls(frame: Frame) {
    for (const owl of owls) {
      owl.glideTimer -= frame.dt;
      if (owl.glideTimer <= 0 && owl.glide === 0) {
        owl.glide = Math.random() < 0.5 ? -1 : 1;
        owl.glideTimer = 34 + Math.random() * 50;
      }

      if (owl.glide !== 0) {
        owl.x += owl.glide * frame.width * 0.08 * frame.dt;
        owl.y += Math.sin(frame.time * 1.4) * frame.height * 0.01 * frame.dt;
        if (owl.x < -frame.width * 0.1 || owl.x > frame.width * 1.1) {
          // Reappears on a new perch after crossing.
          owl.glide = 0;
          owl.perchX =
            Math.random() < 0.5
              ? frame.width * (0.83 + Math.random() * 0.08)
              : frame.width * (0.02 + Math.random() * 0.07);
          owl.perchY = frame.groundY - frame.height * (0.03 + Math.random() * 0.05);
          owl.x = owl.perchX;
          owl.y = owl.perchY;
        }
      } else {
        // Perched: slow head turns and the occasional blink.
        if (Math.random() < 0.006) owl.headTarget = (Math.random() - 0.5) * 1.5;
        owl.headTurn += (owl.headTarget - owl.headTurn) * frame.dt * 2.2;
        owl.blink = Math.max(0, owl.blink - frame.dt * 3);
        if (Math.random() < 0.004) owl.blink = 1;
      }
    }
  }

  function drawOwls(ctx: CanvasRenderingContext2D, frame: Frame, presence: number) {
    if (presence <= 0.05) return;
    const size = Math.max(6, frame.height * 0.016);
    const body: RGB = mix([62, 52, 44], frame.lighting.moonColor, 0.22 * frame.lighting.moonIntensity);

    for (const owl of owls) {
      ctx.save();
      ctx.globalAlpha = presence;
      ctx.translate(owl.x, owl.y);

      if (owl.glide !== 0) {
        ctx.scale(owl.glide, 1);
        ctx.fillStyle = css(scale(body, 0.9));
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.8, size * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        // Broad, silent wings held almost still.
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, 0);
        ctx.quadraticCurveTo(size * 0.4, -size * 0.7, size * 1.5, -size * 0.15);
        ctx.quadraticCurveTo(size * 0.5, size * 0.1, -size * 0.2, size * 0.1);
        ctx.fill();
      } else {
        ctx.fillStyle = css(body);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.42, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.rotate(owl.headTurn * 0.35);
        ctx.beginPath();
        ctx.arc(0, -size * 0.62, size * 0.36, 0, Math.PI * 2);
        ctx.fill();
        // Ear tufts.
        ctx.beginPath();
        ctx.moveTo(-size * 0.34, -size * 0.85);
        ctx.lineTo(-size * 0.16, -size * 1.12);
        ctx.lineTo(-size * 0.02, -size * 0.84);
        ctx.moveTo(size * 0.34, -size * 0.85);
        ctx.lineTo(size * 0.16, -size * 1.12);
        ctx.lineTo(size * 0.02, -size * 0.84);
        ctx.fill();

        // Eyes catch the moonlight.
        const eyeOpen = 1 - owl.blink;
        if (eyeOpen > 0.1) {
          ctx.fillStyle = `rgba(255,214,140,${(0.85 * presence * eyeOpen).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(-size * 0.15, -size * 0.66, size * 0.1, size * 0.1 * eyeOpen, 0, 0, Math.PI * 2);
          ctx.ellipse(size * 0.15, -size * 0.66, size * 0.1, size * 0.1 * eyeOpen, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();
    }
  }

  function updateBats(frame: Frame) {
    for (const bat of bats) {
      // Erratic, jerky flight — nothing like the smooth boids.
      bat.vx += (Math.random() - 0.5) * frame.width * 0.5 * frame.dt;
      bat.vy += (Math.random() - 0.5) * frame.height * 0.4 * frame.dt;
      bat.vx = clamp(bat.vx, -frame.width * 0.16, frame.width * 0.16);
      bat.vy = clamp(bat.vy, -frame.height * 0.09, frame.height * 0.09);
      bat.x += bat.vx * frame.dt;
      bat.y += bat.vy * frame.dt;
      bat.flap += frame.dt * 18;

      if (bat.x < 0) bat.x = frame.width;
      if (bat.x > frame.width) bat.x = 0;
      const ceiling = frame.horizonY * 0.35;
      if (bat.y < ceiling) bat.vy += frame.height * 0.1 * frame.dt;
      if (bat.y > frame.groundY - frame.height * 0.05) bat.vy -= frame.height * 0.1 * frame.dt;
    }
  }

  function drawBats(ctx: CanvasRenderingContext2D, frame: Frame, presence: number) {
    if (presence <= 0.05) return;
    const size = Math.max(2.5, frame.width * 0.004);
    ctx.fillStyle = css([18, 18, 24], 0.72 * presence);
    for (const bat of bats) {
      const beat = Math.abs(Math.sin(bat.flap));
      ctx.beginPath();
      ctx.moveTo(bat.x - size, bat.y);
      ctx.quadraticCurveTo(bat.x - size * 0.4, bat.y - size * beat, bat.x, bat.y);
      ctx.quadraticCurveTo(bat.x + size * 0.4, bat.y - size * beat, bat.x + size, bat.y);
      ctx.quadraticCurveTo(bat.x, bat.y + size * 0.4, bat.x - size, bat.y);
      ctx.fill();
    }
  }

  function drawFlutterers(ctx: CanvasRenderingContext2D, frame: Frame, presence: number) {
    if (presence <= 0.05) return;
    const size = Math.max(2, frame.height * 0.004);
    for (const one of flutterers) {
      one.x += (Math.sin(frame.time * one.speed + one.phase) * frame.width * 0.02 + frame.wind.speed * 4) * frame.dt;
      one.y += Math.cos(frame.time * one.speed * 1.7 + one.phase) * frame.height * 0.012 * frame.dt;
      if (one.x < 0) one.x += frame.width;
      if (one.x > frame.width) one.x -= frame.width;

      const wing = Math.abs(Math.sin(frame.time * 9 + one.phase));
      const color: RGB = one.hue > 0.6 ? [246, 232, 160] : one.hue > 0.3 ? [232, 214, 232] : [226, 168, 110];
      ctx.fillStyle = css(mix(color, frame.lighting.sunColor, 0.25 * frame.lighting.sunIntensity), 0.8 * presence);
      ctx.beginPath();
      ctx.ellipse(one.x - size * 0.5, one.y, size * 0.5, size * (0.25 + wing * 0.75), -0.5, 0, Math.PI * 2);
      ctx.ellipse(one.x + size * 0.5, one.y, size * 0.5, size * (0.25 + wing * 0.75), 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return {
    name: "wildlife",
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
      updateFlock(frame, birdActivity(frame));
      updateOwls(frame);
      updateBats(frame);
    },
    draw(ctx, frame) {
      const hour = frame.now.getHours() + frame.now.getMinutes() / 60;
      const night = frame.lighting.artificialLight;
      const duskWindow = smoothstep(17.5, 19.5, hour) * (1 - smoothstep(21, 22.5, hour));

      drawBirds(ctx, frame);
      drawFlutterers(
        ctx,
        frame,
        frame.season === "spring" || frame.season === "summer"
          ? frame.lighting.dayFactor
          : 0,
      );
      drawBats(ctx, frame, Math.min(duskWindow, night));
      drawOwls(ctx, frame, night);
    },
  };
}
