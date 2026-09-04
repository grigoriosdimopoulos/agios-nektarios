import { createFrameSource, type EngineOptions } from "./frame";
import { createGLRenderer } from "./gl/renderer";
import { FALLBACK_WEATHER, type WeatherSnapshot } from "./weather";
import type { Quality } from "./types";
import type { SceneEngine } from "./engine";
import { detectQuality } from "./engine";

const MAX_DT = 1 / 20;

/**
 * The GPU path. Same world state as the canvas engine, rendered as a
 * photograph the wind can actually move. Returns null when WebGL2 is not
 * available, so the caller can fall back.
 */
export function createGLEngine(
  canvas: HTMLCanvasElement,
  initialOptions: EngineOptions,
): SceneEngine | null {
  const renderer = createGLRenderer(canvas, () => options);
  if (!renderer) return null;

  let options = initialOptions;
  let quality: Quality = detectQuality(initialOptions.quality);
  let weather: WeatherSnapshot = FALLBACK_WEATHER;
  let running = false;
  let raf = 0;
  let lastTime = performance.now();
  // Adaptive resolution: if the device cannot keep up, give it fewer pixels
  // rather than a slideshow.
  let renderScale = 1;
  let slowFrames = 0;
  let fastFrames = 0;

  const frames = createFrameSource({
    options: () => options,
    weather: () => weather,
    quality: () => quality,
  });

  const size = () => ({
    width: canvas.clientWidth || window.innerWidth,
    height: canvas.clientHeight || window.innerHeight,
  });

  function resize() {
    const { width, height } = size();
    // The shader is cheap per pixel, but a phone still has a fill limit.
    const cap = quality === "low" ? 1 : 1.75;
    const dpr = Math.min(window.devicePixelRatio || 1, cap) * renderScale;
    renderer!.resize(width, height, dpr);
  }

  function renderFrame(dt: number) {
    const { width, height } = size();
    renderer!.render(frames.build(width, height, dt));
  }

  function tick(timestamp: number) {
    if (!running) return;
    const elapsed = timestamp - lastTime;
    const dt = Math.min(MAX_DT, Math.max(0, elapsed / 1000));
    lastTime = timestamp;
    renderFrame(dt);

    if (elapsed > 26) {
      slowFrames++;
      fastFrames = 0;
    } else if (elapsed < 15) {
      fastFrames++;
      slowFrames = 0;
    }
    if (slowFrames > 45 && renderScale > 0.55) {
      renderScale = Math.max(0.55, renderScale - 0.2);
      slowFrames = 0;
      resize();
    } else if (fastFrames > 240 && renderScale < 1) {
      renderScale = Math.min(1, renderScale + 0.2);
      fastFrames = 0;
      resize();
    }
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

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
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
      renderer.dispose();
    },
    renderStatic() {
      resize();
      // A few steps so the plates are loaded and the state has settled.
      renderFrame(1 / 30);
      window.setTimeout(() => renderFrame(1 / 30), 400);
      window.setTimeout(() => renderFrame(1 / 30), 1200);
    },
    setWeather(next) {
      weather = next;
    },
    setOptions(next) {
      options = next;
      quality = detectQuality(next.quality);
      resize();
    },
  };
}
