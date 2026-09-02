import { clamp, mulberry32 } from "../noise";
import { css, mix, type RGB } from "../palette";
import { fallingLeafColor } from "../foliage";
import { drainSpawns, type SpawnKind } from "../particles";
import type { Frame, Layer } from "../types";

type Kind = SpawnKind | "rain" | "snow" | "firefly" | "mote";

type Particle = {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Rotation and spin for anything with a flat face. */
  angle: number;
  spin: number;
  size: number;
  tone: number;
  silhouette: boolean;
  life: number;
  maxLife: number;
  /** Phase for flutter and blinking. */
  phase: number;
  landed: boolean;
};

const MAX_BY_QUALITY = { low: 140, medium: 320, high: 620 } as const;

/**
 * Everything that falls, drifts or blinks: rain, snow, leaves shaken loose by
 * the wind, blossom, acorns, summer fireflies and daytime motes.
 */
export function createParticleLayer({ weatherOnly = false } = {}): Layer {
  const particles: Particle[] = [];
  const random = mulberry32(77);
  let spawnAccumulator = 0;

  function spawn(
    frame: Frame,
    kind: Kind,
    x?: number,
    y?: number,
    tone?: number,
    size?: number,
    silhouette = false,
  ) {
    if (particles.length >= MAX_BY_QUALITY[frame.quality]) return;
    const px = x ?? random() * frame.width * 1.2 - frame.width * 0.1;
    const py = y ?? -frame.height * 0.05 * random();

    const base: Particle = {
      kind,
      x: px,
      y: py,
      vx: 0,
      vy: 0,
      angle: random() * Math.PI * 2,
      spin: (random() - 0.5) * 3,
      size: size ?? 3,
      tone: tone ?? random(),
      silhouette,
      life: 0,
      maxLife: 40,
      phase: random() * Math.PI * 2,
      landed: false,
    };

    switch (kind) {
      case "rain":
        base.size = frame.height * (0.008 + random() * 0.012);
        base.vy = frame.height * (0.55 + random() * 0.3);
        base.maxLife = 6;
        break;
      case "snow":
        base.size = frame.height * (0.0016 + random() * 0.0028);
        base.vy = frame.height * (0.03 + random() * 0.04);
        base.maxLife = 26;
        break;
      case "firefly":
        base.x = random() * frame.width;
        base.y = frame.groundY - frame.height * random() * 0.16;
        base.size = frame.height * 0.0022;
        base.maxLife = 14 + random() * 12;
        break;
      case "mote":
        base.x = random() * frame.width;
        base.y = frame.groundY - frame.height * random() * 0.3;
        base.size = frame.height * (0.0009 + random() * 0.0016);
        base.maxLife = 18 + random() * 14;
        break;
      case "fruit":
        base.size = size ?? frame.height * 0.005;
        base.maxLife = 16;
        break;
      default:
        base.size = size ?? frame.height * 0.007;
        base.maxLife = 22;
    }

    particles.push(base);
  }

  function step(particle: Particle, frame: Frame) {
    const dt = frame.dt;
    const windX = frame.wind.speed * frame.height * 0.02;
    const gravity = frame.height * 0.9;
    particle.life += dt;

    if (particle.landed) return;

    switch (particle.kind) {
      case "rain": {
        // Rain is heavy: it barely deviates, but strong wind shears it over.
        particle.vx += (windX * 1.6 - particle.vx) * dt * 3.2;
        particle.vy += gravity * dt * 0.9;
        break;
      }
      case "snow": {
        // Light and draggy — it follows the air almost exactly and flutters.
        particle.vx += (windX * 1.15 - particle.vx) * dt * 1.4;
        particle.vx += Math.sin(frame.time * 1.6 + particle.phase) * frame.height * 0.02 * dt;
        particle.vy += (frame.height * 0.055 - particle.vy) * dt * 1.1;
        break;
      }
      case "firefly": {
        particle.vx += (Math.sin(frame.time * 0.7 + particle.phase) * frame.height * 0.015 - particle.vx) * dt;
        particle.vy += (Math.cos(frame.time * 0.5 + particle.phase * 1.7) * frame.height * 0.008 - particle.vy) * dt;
        break;
      }
      case "mote": {
        particle.vx += (windX * 0.35 - particle.vx) * dt * 0.8;
        particle.vy += (-frame.height * 0.004 + Math.sin(frame.time * 0.4 + particle.phase) * frame.height * 0.004 - particle.vy) * dt;
        break;
      }
      case "fruit": {
        // Dense: gravity dominates, wind barely matters.
        particle.vx += (windX * 0.25 - particle.vx) * dt * 0.9;
        particle.vy += gravity * dt * 0.75;
        particle.spin += dt * 2;
        break;
      }
      default: {
        // Leaves, needles and petals: drag, wind advection and an aerodynamic
        // flutter that makes them swing from side to side as they fall.
        const flutter = Math.sin(frame.time * 3.1 + particle.phase);
        particle.vx += (windX - particle.vx) * dt * 1.9;
        particle.vx += flutter * frame.height * 0.055 * dt;
        particle.vy += (frame.height * (0.075 + particle.tone * 0.05) - particle.vy) * dt * 1.5;
        particle.vy -= flutter * frame.height * 0.02 * dt;
        particle.angle += particle.spin * dt * (0.5 + Math.abs(flutter));
        break;
      }
    }

    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    const floor = frame.groundY + frame.height * 0.05;
    if (particle.y >= floor && particle.kind !== "firefly" && particle.kind !== "mote") {
      if (particle.kind === "fruit" && Math.abs(particle.vy) > frame.height * 0.1) {
        // One small bounce, then it settles.
        particle.vy *= -0.32;
        particle.vx *= 0.5;
        particle.y = floor - 1;
      } else {
        particle.landed = true;
        particle.y = floor;
        particle.vx = 0;
        particle.vy = 0;
      }
    }
  }

  function targetCount(frame: Frame, kind: Kind): number {
    const cap = MAX_BY_QUALITY[frame.quality];
    const intensity = frame.intensity;
    switch (kind) {
      case "rain":
        if (frame.weather.condition === "rain") return cap * 0.55 * intensity;
        if (frame.weather.condition === "storm") return cap * 0.8 * intensity;
        return 0;
      case "snow":
        return frame.weather.condition === "snow" ? cap * 0.6 * intensity : 0;
      case "firefly":
        return frame.season === "summer" && frame.lighting.artificialLight > 0.5
          ? 18 * intensity
          : 0;
      case "mote":
        return frame.lighting.dayFactor > 0.4 ? 26 * intensity : 0;
      default:
        return 0;
    }
  }

  function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle, frame: Frame) {
    const { lighting } = frame;
    const fade = particle.landed
      ? clamp(1 - (particle.life - particle.maxLife * 0.5) / 4)
      : 1;
    if (fade <= 0.02) return;

    switch (particle.kind) {
      case "rain": {
        const alpha = 0.28 * fade * (0.4 + lighting.dayFactor * 0.6 + lighting.artificialLight * 0.2);
        ctx.strokeStyle = css(mix([176, 196, 220], lighting.sunColor, 0.2 * lighting.sunIntensity), alpha);
        ctx.lineWidth = Math.max(0.6, frame.height * 0.0011);
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 0.035, particle.y - particle.vy * 0.035);
        ctx.stroke();
        break;
      }
      case "snow": {
        ctx.fillStyle = css(
          mix([248, 250, 255], lighting.hazeColor, 0.25),
          clamp(0.85 * fade * (0.35 + lighting.ambientIntensity)),
        );
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "firefly": {
        const blink = Math.max(0, Math.sin(frame.time * 2.2 + particle.phase));
        const alpha = blink ** 3 * 0.9 * fade;
        if (alpha < 0.02) break;
        const glow = ctx.createRadialGradient(
          particle.x, particle.y, 0, particle.x, particle.y, particle.size * 9,
        );
        glow.addColorStop(0, `rgba(214,255,166,${alpha.toFixed(3)})`);
        glow.addColorStop(1, "rgba(214,255,166,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 9, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "mote": {
        ctx.fillStyle = css(
          mix([255, 246, 226], lighting.sunColor, 0.5 * lighting.sunIntensity),
          0.28 * fade * lighting.dayFactor,
        );
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "fruit": {
        const color: RGB = particle.silhouette
          ? [26, 26, 24]
          : frame.season === "autumn" ? [122, 84, 44] : [92, 108, 52];
        ctx.fillStyle = css(
          mix(color, lighting.sunColor, 0.2 * lighting.sunIntensity),
          clamp(0.9 * fade * (0.3 + lighting.ambientIntensity)),
        );
        ctx.beginPath();
        ctx.ellipse(particle.x, particle.y, particle.size * 0.7, particle.size, particle.angle, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default: {
        const color = particle.silhouette
          ? mix([22, 24, 22], [40, 38, 30], particle.tone)
          : particle.kind === "petal"
            ? mix([248, 226, 236], [236, 200, 216], particle.tone)
            : particle.kind === "needle"
              ? mix([76, 92, 58], [58, 74, 48], particle.tone)
              : fallingLeafColor(frame.season, particle.tone);
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.angle);
        ctx.fillStyle = particle.silhouette
          ? css(color, clamp(0.8 * fade))
          : css(
              mix(color, lighting.sunColor, 0.22 * lighting.sunIntensity),
              clamp(0.92 * fade * (0.3 + lighting.ambientIntensity)),
            );
        ctx.beginPath();
        if (particle.kind === "needle") {
          ctx.rect(-particle.size * 0.08, -particle.size, particle.size * 0.16, particle.size * 2);
        } else {
          // A leaf: two arcs meeting at the tip and the stem.
          ctx.ellipse(0, 0, particle.size * 0.55, particle.size, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
        break;
      }
    }
  }

  return {
    name: "particles",
    update(frame) {
      // Anything the forest shook loose this frame. With the photograph in
      // place there is no drawn tree to shed anything, and a leaf big enough
      // to see at that distance would be the size of a car.
      for (const request of weatherOnly ? [] : drainSpawns()) {
        spawn(
          frame, request.kind, request.x, request.y, request.tone, request.size,
          request.silhouette,
        );
      }

      // Weather and ambient life are kept topped up to a target population.
      spawnAccumulator += frame.dt;
      if (spawnAccumulator > 0.05) {
        spawnAccumulator = 0;
        const ambient = weatherOnly
          ? (["rain", "snow"] as const)
          : (["rain", "snow", "firefly", "mote"] as const);
        for (const kind of ambient) {
          const target = targetCount(frame, kind);
          if (target <= 0) continue;
          const current = particles.reduce(
            (total, particle) => total + (particle.kind === kind ? 1 : 0),
            0,
          );
          const deficit = Math.min(6, Math.ceil(target - current));
          for (let i = 0; i < deficit; i++) spawn(frame, kind);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        step(particle, frame);
        const expired =
          particle.life > particle.maxLife ||
          particle.y > frame.height * 1.2 ||
          particle.x < -frame.width * 0.3 ||
          particle.x > frame.width * 1.3;
        if (expired) particles.splice(i, 1);
      }
    },
    draw(ctx, frame) {
      for (const particle of particles) drawParticle(ctx, particle, frame);
    },
  };
}
