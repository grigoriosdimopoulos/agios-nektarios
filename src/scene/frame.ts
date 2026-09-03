import { moonPosition, sunPosition } from "./astronomy";
import {
  holidayOf,
  isResurrectionNight,
  seasonOf,
  seasonProgress,
  type Holiday,
  type Season,
} from "./calendar";
import { clamp } from "./noise";
import { computeLighting } from "./palette";
import { sampleWind } from "./wind";
import { FALLBACK_WEATHER, type WeatherCondition, type WeatherSnapshot } from "./weather";
import type { Frame, Quality, SceneOptions } from "./types";

export type Overrides = {
  time: "auto" | "dawn" | "day" | "dusk" | "night";
  weather: "auto" | WeatherCondition;
  season: "auto" | Season;
  holiday: string;
};

export type EngineOptions = SceneOptions & { overrides: Overrides };

/** Picks a moment of the current day that matches a forced time-of-day. */
export function overrideDate(
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

export function applyWeatherOverride(
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

/**
 * The state of the world for one frame — sun, moon, weather, season, wind and
 * the slow things like lying snow and lightning. Shared by both renderers so
 * the WebGL and canvas paths can never drift apart.
 */
export function createFrameSource(read: {
  options: () => EngineOptions;
  weather: () => WeatherSnapshot;
  quality: () => Quality;
}) {
  const startedAt = performance.now();
  let snowCover = 0;
  let flash = 0;
  let nextStrike = 4 + Math.random() * 12;

  return {
    build(width: number, height: number, dt: number): Frame {
      const options = read.options();
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

      const weather = applyWeatherOverride(read.weather(), options.overrides.weather);
      const season: Season =
        options.overrides.season === "auto" ? seasonOf(now) : options.overrides.season;
      const holiday: Holiday =
        options.overrides.holiday === ""
          ? holidayOf(now)
          : (options.overrides.holiday as Holiday);

      const lighting = computeLighting(sunAltitudeDeg, moon, weather, season);
      const time = (performance.now() - startedAt) / 1000;
      const wind = sampleWind(time, weather);

      const horizonY = height * 0.58;
      const groundY = height * 0.62;

      // Sun and moon are placed as if the camera looks due south: the azimuth
      // is measured from south, so the sun rises left and sets right.
      // A panoramic mapping. A 140° window put the moon off the side of the
      // frame for most of the night; across 260° the sun and moon stay in
      // view for as long as they are up, which is what a visitor expects.
      const project = (altitude: number, azimuth: number) => {
        const span = (260 * Math.PI) / 180;
        return {
          x: width * (0.5 + clamp(azimuth / span, -0.46, 0.46)),
          y: horizonY - (altitude / (Math.PI / 2)) * horizonY * 1.1,
        };
      };

      // Lying snow builds while it snows and melts once it is above freezing.
      const target =
        weather.condition === "snow"
          ? 0.85
          : weather.temperature < 1 && season === "winter"
            ? 0.3
            : 0;
      snowCover = clamp(
        snowCover + clamp(target - snowCover, -1, 1) * (target > snowCover ? 0.035 : 0.02) * dt * 8,
      );

      // Lightning during a storm briefly lights the whole valley.
      if (weather.condition === "storm") {
        nextStrike -= dt;
        if (nextStrike <= 0) {
          nextStrike = 3 + Math.random() * 14;
          flash = 1;
        }
      }
      flash = Math.max(0, flash - dt * 3.4);

      return {
        time,
        dt,
        width,
        height,
        horizonY,
        groundY,
        lighting,
        wind,
        weather,
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
        quality: read.quality(),
        intensity: options.intensity,
        snowCover,
        flash,
        now,
      };
    },
  };
}

export { FALLBACK_WEATHER };
