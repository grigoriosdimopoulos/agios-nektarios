import { smoothstep } from "./noise";
import { css } from "./palette";
import { createFrameSource, type EngineOptions } from "./frame";
import { FALLBACK_WEATHER, type WeatherSnapshot } from "./weather";
import type { Frame, Layer, Quality } from "./types";
import { createSkyLayer } from "./layers/sky";
import { createTerrainLayer } from "./layers/terrain";
import { createForestLayer } from "./layers/forest";
import { createVillageLayer } from "./layers/village";
import { createParticleLayer } from "./layers/particles";
import { createWildlifeLayer } from "./layers/wildlife";
import { createHolidayLayer } from "./layers/holiday";
import { createForegroundLayer } from "./layers/foreground";
import { createCameraLayer } from "./layers/camera";
import { createPlateLayer } from "./layers/plates";
import { createPhotoLayer } from "./layers/photo";

export type { Overrides, EngineOptions } from "./frame";

const MAX_DT = 1 / 20;

export function detectQuality(preferred: Quality | "auto"): Quality {
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

  const frames = createFrameSource({
    options: () => options,
    weather: () => weather,
    quality: () => quality,
  });

  const size = () => ({
    width: canvas.clientWidth || window.innerWidth,
    height: canvas.clientHeight || window.innerHeight,
  });

  const layers: Layer[] = [];

  function rebuildLayers() {
    const customGround = Boolean(
      options.plates.far || options.plates.mid || options.plates.near,
    );
    // The built-in photograph of the settlement is the default backdrop; it
    // steps aside as soon as the administrator uploads their own plates.
    const usePhoto = !customGround;

    layers.length = 0;
    layers.push(createSkyLayer({ softClouds: usePhoto }));
    if (options.plates.sky) layers.push(createPlateLayer(options.plates, "sky"));

    if (usePhoto) {
      // Nothing is drawn on top of the photograph. Anything with an outline —
      // a tree, a bird, a flag — announces itself as a drawing the moment it
      // sits next to real pixels, so the scene is carried entirely by the
      // photograph, the light on it, and what a camera would actually record:
      // weather in the air and lamps coming on in the windows.
      layers.push(createPhotoLayer("ridge"));
      layers.push(createPhotoLayer("forest"));
      layers.push(createParticleLayer({ weatherOnly: true }));
      if (options.holidayThemes) {
        layers.push(createHolidayLayer({ anchored: true, lightsOnly: true }));
      }
      return;
    }

    layers.push(createTerrainLayer());
    layers.push(createPlateLayer(options.plates, "ground"));
    if (options.village) layers.push(createVillageLayer());
    layers.push(createForestLayer());
    if (options.wildlife) layers.push(createWildlifeLayer());
    layers.push(createForegroundLayer());
    layers.push(createParticleLayer());
    if (options.holidayThemes) layers.push(createHolidayLayer());
  }

  const camera = createCameraLayer();

  function resize() {
    // Every pass here is a full-screen blend, so pixel count is the budget.
    const dpr = Math.min(window.devicePixelRatio || 1, quality === "low" ? 1 : 1.5);
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { width: w, height: h } = size();
    const next = frames.build(w, h, 0);
    for (const layer of layers) layer.resize?.(next);
  }



  function atmosphere(next: Frame) {
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

    // Vignette and grain belong to the camera pass, which runs after this.
  }

  /** Applied last, so text stays readable over the image. */
  function legibility(next: Frame) {
    const dark = 1 - next.lighting.dayFactor;
    const floor = ctx.createLinearGradient(0, next.height * 0.55, 0, next.height);
    floor.addColorStop(0, "rgba(7,8,9,0)");
    floor.addColorStop(1, `rgba(7,8,9,${(0.16 + 0.32 * dark).toFixed(3)})`);
    ctx.fillStyle = floor;
    ctx.fillRect(0, next.height * 0.55, next.width, next.height * 0.45);
  }

  function renderFrame(dt: number) {
    const { width: w, height: h } = size();
    const next = frames.build(w, h, dt);

    for (const layer of layers) layer.update?.(next);

    ctx.fillStyle = css(next.lighting.zenith);
    ctx.fillRect(0, 0, next.width, next.height);
    for (const layer of layers) layer.draw(ctx, next);
    atmosphere(next);
    camera.draw(ctx, next);
    legibility(next);
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
