"use client";

import { useEffect, useRef } from "react";

import type { SceneSettings } from "@/lib/content/schema";
import { createSceneEngine, type EngineOptions } from "@/scene/engine";
import type { Season } from "@/scene/calendar";
import type { WeatherCondition, WeatherSnapshot } from "@/scene/weather";

const WEATHER_REFRESH_MS = 10 * 60 * 1000;

function toEngineOptions(settings: SceneSettings): EngineOptions {
  return {
    intensity: settings.intensity,
    quality: settings.quality,
    wildlife: settings.wildlife,
    village: settings.village,
    holidayThemes: settings.holidayThemes,
    latitude: settings.latitude,
    longitude: settings.longitude,
    plates: settings.plates,
    overrides: {
      time: settings.override.time,
      weather: settings.override.weather as "auto" | WeatherCondition,
      season: settings.override.season as "auto" | Season,
      holiday: settings.override.holiday,
    },
  };
}

/**
 * The living backdrop: a fixed canvas behind the whole site that follows the
 * real sun, moon, weather, season and feast day at Άγιος Νεκτάριος.
 */
export function LivingScene({ settings }: { settings: SceneSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !settings.enabled) return;

    let engine: ReturnType<typeof createSceneEngine>;
    try {
      engine = createSceneEngine(canvas, toEngineOptions(settings));
    } catch {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      engine.renderStatic();
    } else {
      engine.start();
    }

    let cancelled = false;
    const loadWeather = async () => {
      if (!settings.liveWeather) return;
      try {
        const response = await fetch("/api/weather");
        if (!response.ok) return;
        const snapshot = (await response.json()) as WeatherSnapshot;
        if (!cancelled) engine.setWeather(snapshot);
      } catch {
        // Keep the fallback conditions; the scene still runs.
      }
    };

    void loadWeather();
    const interval = window.setInterval(loadWeather, WEATHER_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      engine.stop();
    };
  }, [settings]);

  if (!settings.enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-[var(--void)]"
      aria-hidden
      style={{ opacity: 0.6 + settings.intensity * 0.4 }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
