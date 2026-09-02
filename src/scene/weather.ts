/** Live conditions from Open-Meteo, reduced to what the scene needs to draw. */

export type WeatherCondition =
  | "clear"
  | "clouds"
  | "rain"
  | "snow"
  | "fog"
  | "storm";

export type WeatherSnapshot = {
  condition: WeatherCondition;
  /** 0–1 */
  cloudCover: number;
  /** mm per hour */
  precipitation: number;
  /** m/s at 10 m */
  windSpeed: number;
  /** Degrees, meteorological (direction the wind comes from). */
  windDirection: number;
  /** m/s */
  windGusts: number;
  temperature: number;
  humidity: number;
  isDay: boolean;
  fetchedAt: number;
};

export const FALLBACK_WEATHER: WeatherSnapshot = {
  condition: "clear",
  cloudCover: 0.15,
  precipitation: 0,
  windSpeed: 2.5,
  windDirection: 300,
  windGusts: 4,
  temperature: 16,
  humidity: 0.55,
  isDay: true,
  fetchedAt: 0,
};

/** WMO weather interpretation codes → the six looks the scene can render. */
export function conditionFromCode(code: number, cloudCover: number): WeatherCondition {
  if (code >= 95) return "storm";
  if (code >= 71 && code <= 77) return "snow";
  if (code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (cloudCover > 0.55) return "clouds";
  return "clear";
}

type OpenMeteoCurrent = {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  is_day?: number;
  precipitation?: number;
  weather_code?: number;
  cloud_cover?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
};

export function normalizeOpenMeteo(current: OpenMeteoCurrent): WeatherSnapshot {
  const cloudCover = (current.cloud_cover ?? 20) / 100;
  return {
    condition: conditionFromCode(current.weather_code ?? 0, cloudCover),
    cloudCover,
    precipitation: current.precipitation ?? 0,
    // Open-Meteo reports km/h by default; the scene works in m/s.
    windSpeed: (current.wind_speed_10m ?? 8) / 3.6,
    windDirection: current.wind_direction_10m ?? 300,
    windGusts: (current.wind_gusts_10m ?? 14) / 3.6,
    temperature: current.temperature_2m ?? 15,
    humidity: (current.relative_humidity_2m ?? 55) / 100,
    isDay: (current.is_day ?? 1) === 1,
    fetchedAt: Date.now(),
  };
}
