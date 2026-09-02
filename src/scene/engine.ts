import { moonPosition, sunPosition } from "./astronomy";
import { holidayOf, isResurrectionNight, seasonOf, seasonProgress, type Holiday, type Season } from "./calendar";
import { clamp, smoothstep } from "./noise";
import { computeLighting, css } from "./palette";
import { sampleWind } from "./wind";
import { FALLBACK_WEATHER, type WeatherCondition, type WeatherSnapshot } from "./weather";
import type { Frame, Layer, Quality, SceneOptions } from "./types";
import { createSkyLayer } from "./layers/sky";
import { createTerrainLayer } from "./layers/terrain";
import { createForestLayer } from "./layers/forest";
import { createVillageLayer } from "./layers/village";
import { createParticleLayer } from "./layers/particles";
import { createWildlifeLayer } from "./layers/wildlife";
import { createHolidayLayer } from "./layers/holiday";
import { createForegroundLayer } from "./layers/foreground";
import { createPlateLayer } from "./layers/plates";

export type Overrides = {
  time: "auto" | "dawn" | "day" | "dusk" | "night";
  weather: "auto" | WeatherCondition;
  season: "auto" | Season;
  holiday: string;
};

export type EngineOptions = SceneOptions & { overrides: Overrides };

const MAX_DT = 1 / 20;

/** Picks a moment of the current day that matches a forced time-of-day. */
function overrideDate(
  now: Date,
  mode: Overrides["time"],
  latitude: number,
  longitude: number,
): Date {
  if (mode === "auto") return now;

  const day = new Date(now);
  day.setHours(0, 0, 0, 0);

  let best = new Date(now);
  let bestScore = -Infinity;
  // Scan the day in five-minute steps and keep the moment that best matches.
  for (let minutes = 0; minutes < 24 * 60; minutes += 5) {
    const candidate = new Date(day.getTime() + minutes * 60000);
    const altitude = (sunPosition(candidate, latitude, longitude).altitude * 180) / Math.PI;
    let score: number;
    switch (mode) {
      case "dawn":
        // Just after sunrise, and in the morning half of the day.
        score = -Math.abs(altitude - 3) - (minutes > 12 * 60 ? 100 : 0);
        break;
      case "day":
        score = altitude;
        break;
      case "dusk":
        score = -Math.abs(altitude + 2) - (minutes < 12 * 60 ? 100 : 0);
        break;
      case "night":
        score = -altitude;
        break;
      default:
        score = 0;
    }
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function applyWeatherOverride(
  weather: WeatherSnapshot,
  override: Overrides["weather"],
): WeatherSnapshot {
  if (override === "auto") return weather;
  const preset: Record<WeatherCondition, Partial<WeatherSnapshot>> = {
    clear: { cloudCover: 0.08, precipitation: 0 },
    clouds: { cloudCover: 0.78, precipitation: 0 },
    rain: { cloudCover: 0.9, precipitation: 2.4, humidity: 0.9 },
    snow: { cloudCover: 0.85, precipitation: 1.2, temperature: -1 },
    fog: { cloudCover: 0.5, precipitation: 0, humidity: 0.98 },
    storm: { cloudCover: 0.97, precipitation: 6, windSpeed: 12, windGusts: 20 },
  };
  return { ...weather, ...preset[override], condition: override };
}

function detectQuality(preferred: Quality | "auto"): Quality {
  if (preferred !== "auto") return preferred;
  if (typeof navigator === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  if (coarse || cores <= 4) return "low";
  if (cores <= 8) return "medium";
  return "high";
}

export type SceneEngine = {
  start: () => void;
  stop: () => void;
  renderStatic: () => void;
  setWeather: (weather: WeatherSnapshot) => void;
  setOptions: (options: EngineOptions) => void;
};

export function createSceneEngine(
  canvas: HTMLCanvasElement,
  initialOptions: EngineOptions,
): SceneEngine {
  const context2d = canvas.getContext("2d", { alpha: false });
  if (!context2d) throw new Error("Canvas 2D is not available");
  const ctx: CanvasRenderingContext2D = context2d;

  let options = initialOptions;
  let quality = detectQuality(initialOptions.quality);
  let weather: WeatherSnapshot = FALLBACK_WEATHER;

  let raf = 0;
  let running = false;
  let startedAt = performance.now();
  let lastTime = startedAt;
  let snowCover = 0;
  let flash = 0;
  let nextStrike = 4 + Math.random() * 12;

  const layers: Layer[] = [];

  function rebuildLayers() {
    layers.length = 0;
    layers.push(createSkyLayer());
    if (options.plates.sky) layers.push(createPlateLayer(options.plates, "sky"));
    layers.push(createTerrainLayer());
    if (options.plates.far || options.plates.mid || options.plates.near) {
      layers.push(createPlateLayer(options.plates, "ground"));
    }
    if (options.village) layers.push(createVillageLayer());
    layers.push(createForestLayer());
    if (options.wildlife) layers.push(createWildlifeLayer());
    layers.push(createForegroundLayer());
    layers.push(createParticleLayer());
    if (options.holidayThemes) layers.push(createHolidayLayer());
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, quality === "low" ? 1.5 : 2);
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const next = buildFrame(0);
    for (const layer of layers) layer.resize?.(next);
  }

  function buildFrame(dt: number): Frame {
    const realNow = new Date();
    const now = overrideDate(
      realNow,
      options.overrides.time,
      options.latitude,
      options.longitude,
    );

    const sun = sunPosition(now, options.latitude, options.longitude);
    const moon = moonPosition(now, options.latitude, options.longitude);
    const sunAltitudeDeg = (sun.altitude * 180) / Math.PI;

    const activeWeather = applyWeatherOverride(weather, options.overrides.weather);
    const season: Season =
      options.overrides.season === "auto" ? seasonOf(now) : options.overrides.season;
    const holiday: Holiday =
      options.overrides.holiday === ""
        ? holidayOf(now)
        : (options.overrides.holiday as Holiday);

    const lighting = computeLighting(sunAltitudeDeg, moon, activeWeather, season);
    const wind = sampleWind((performance.now() - startedAt) / 1000, activeWeather);

    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const horizonY = height * 0.58;
    const groundY = height * 0.62;

    // Sun and moon are placed as if the camera looks due south: the azimuth is
    // measured from south, so the sun rises on the left and sets on the right.
    const project = (altitude: number, azimuth: number) => {
      const span = (140 * Math.PI) / 180;
      const x = width * (0.5 + clamp(azimuth / span, -0.75, 0.75));
      const y = horizonY - (altitude / (Math.PI / 2)) * horizonY * 1.1;
      return { x, y };
    };

    return {
      time: (performance.now() - startedAt) / 1000,
      dt,
      width,
      height,
      horizonY,
      groundY,
      lighting,
      wind,
      weather: activeWeather,
      season,
      seasonT: seasonProgress(now),
      holiday,
      resurrectionNight:
        holiday === "easter" &&
        (options.overrides.holiday !== "" || isResurrectionNight(realNow)),
      sun,
      moon,
      sunScreen: project(sun.altitude, sun.azimuth),
      moonScreen: project(moon.altitude, moon.azimuth),
      quality,
      intensity: options.intensity,
      snowCover,
      flash,
      now,
    };
  }

  function updateEnvironment(next: Frame) {
    // Lying snow builds while it snows and melts once it is above freezing.
    const target =
      next.weather.condition === "snow"
        ? 0.85
        : next.weather.temperature < 1 && next.season === "winter"
          ? 0.3
          : 0;
    const rate = target > snowCover ? 0.035 : 0.02;
    snowCover += clamp(target - snowCover, -1, 1) * rate * next.dt * 8;
    snowCover = clamp(snowCover);

    // Lightning during a storm briefly lights the whole valley.
    if (next.weather.condition === "storm") {
      nextStrike -= next.dt;
      if (nextStrike <= 0) {
        nextStrike = 3 + Math.random() * 14;
        flash = 1;
      }
    }
    flash = Math.max(0, flash - next.dt * 3.4);
  }

  function grade(next: Frame) {
    const { lighting } = next;

    // Ground fog sits in the valley on humid, still mornings.
    if (lighting.hazeDensity > 0.25) {
      const fogTop = next.groundY - next.height * 0.12;
      const fog = ctx.createLinearGradient(0, fogTop, 0, next.height);
      fog.addColorStop(0, css(lighting.hazeColor, 0));
      fog.addColorStop(0.5, css(lighting.hazeColor, (lighting.hazeDensity - 0.2) * 0.7));
      fog.addColorStop(1, css(lighting.hazeColor, (lighting.hazeDensity - 0.2) * 0.45));
      ctx.fillStyle = fog;
      ctx.fillRect(0, fogTop, next.width, next.height - fogTop);
    }

    if (next.flash > 0.01) {
      ctx.fillStyle = `rgba(214,226,255,${(next.flash * 0.5).toFixed(3)})`;
      ctx.fillRect(0, 0, next.width, next.height);
    }

    // A light vignette, deeper at night; daylight is left bright.
    const dark = 1 - lighting.dayFactor;
    const vignette = ctx.createRadialGradient(
      next.width / 2, next.height * 0.45, next.height * 0.25,
      next.width / 2, next.height * 0.5, next.height * 0.95,
    );
    vignette.addColorStop(0, "rgba(4,5,7,0)");
    vignette.addColorStop(1, `rgba(4,5,7,${(0.16 + 0.26 * dark).toFixed(3)})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, next.width, next.height);

    // Just enough of a floor tint to keep body text legible over the ground.
    const legibility = ctx.createLinearGradient(0, next.height * 0.55, 0, next.height);
    legibility.addColorStop(0, "rgba(7,8,9,0)");
    legibility.addColorStop(1, `rgba(7,8,9,${(0.16 + 0.34 * dark).toFixed(3)})`);
    ctx.fillStyle = legibility;
    ctx.fillRect(0, next.height * 0.55, next.width, next.height * 0.45);
  }

  function renderFrame(dt: number) {
    const next = buildFrame(dt);
    updateEnvironment(next);

    for (const layer of layers) layer.update?.(next);

    ctx.fillStyle = css(next.lighting.zenith);
    ctx.fillRect(0, 0, next.width, next.height);
    for (const layer of layers) layer.draw(ctx, next);
    grade(next);
  }

  function tick(timestamp: number) {
    if (!running) return;
    const dt = Math.min(MAX_DT, Math.max(0, (timestamp - lastTime) / 1000));
    lastTime = timestamp;
    renderFrame(dt);
    raf = requestAnimationFrame(tick);
  }

  const onResize = () => resize();
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (running) {
      lastTime = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };

  rebuildLayers();

  return {
    start() {
      if (running) return;
      running = true;
      startedAt = performance.now();
      lastTime = startedAt;
      resize();
      window.addEventListener("resize", onResize, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    },
    /** One still frame — used when the visitor prefers reduced motion. */
    renderStatic() {
      resize();
      // A few settling steps so springs and populations are not at zero.
      for (let i = 0; i < 30; i++) renderFrame(1 / 30);
    },
    setWeather(next) {
      weather = next;
    },
    setOptions(next) {
      const platesChanged =
        JSON.stringify(next.plates) !== JSON.stringify(options.plates);
      const structureChanged =
        next.village !== options.village ||
        next.wildlife !== options.wildlife ||
        next.holidayThemes !== options.holidayThemes;
      options = next;
      quality = detectQuality(next.quality);
      if (platesChanged || structureChanged) {
        rebuildLayers();
        resize();
      }
    },
  };
}

export const sceneSmoothstep = smoothstep;
