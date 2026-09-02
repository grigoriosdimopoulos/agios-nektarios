import { fbm1 } from "./noise";
import type { Wind } from "./types";
import type { WeatherSnapshot } from "./weather";

/**
 * A single horizontal wind value shared by every layer, so leaves, snow, smoke
 * and branches all move together instead of drifting independently.
 */
export function sampleWind(time: number, weather: WeatherSnapshot): Wind {
  // Meteorological direction is where the wind comes FROM; on screen we face
  // south, so an easterly component pushes things to the right.
  const radians = (weather.windDirection * Math.PI) / 180;
  const eastward = -Math.sin(radians);

  const base = weather.windSpeed * eastward;
  const gustRange = Math.max(0, weather.windGusts - weather.windSpeed);
  // Two octaves at different rates read as breath rather than as a sine wave.
  const slow = fbm1(time * 0.06, 3) - 0.5;
  const fast = fbm1(time * 0.42 + 31.7, 2) - 0.5;
  const gust = (slow * 1.4 + fast * 0.8) * gustRange * eastward;

  const speed = base + gust;
  return {
    speed,
    gust,
    force: Math.max(-1, Math.min(1, speed / 12)),
  };
}
