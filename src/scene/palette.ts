/**
 * Turns the sun's elevation, the moon and the weather into the colours the
 * scene paints with: sky gradient, key light, ambient fill, haze and exposure.
 */
import { clamp, lerp, smoothstep } from "./noise";
import type { Season } from "./calendar";
import type { WeatherSnapshot } from "./weather";
import type { MoonInfo } from "./astronomy";

export type RGB = [number, number, number];

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
}

export function css(color: RGB, alpha = 1): string {
  return `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(
    color[2],
  )},${alpha.toFixed(3)})`;
}

export function scale(color: RGB, factor: number): RGB {
  return [color[0] * factor, color[1] * factor, color[2] * factor];
}

export function desaturate(color: RGB, amount: number): RGB {
  const luma = 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];
  return mix(color, [luma, luma, luma], amount);
}

type SkyStop = { elevation: number; zenith: RGB; horizon: RGB };

/** Sky colours sampled at a range of solar elevations (degrees). */
const SKY_STOPS: SkyStop[] = [
  { elevation: -18, zenith: [5, 7, 15], horizon: [11, 15, 27] },
  { elevation: -12, zenith: [7, 11, 23], horizon: [24, 27, 47] },
  { elevation: -6, zenith: [16, 25, 49], horizon: [63, 55, 78] },
  { elevation: -2, zenith: [32, 47, 82], horizon: [133, 89, 92] },
  { elevation: 0, zenith: [48, 71, 114], horizon: [212, 127, 86] },
  { elevation: 4, zenith: [72, 113, 168], horizon: [239, 172, 111] },
  { elevation: 10, zenith: [80, 129, 190], horizon: [203, 199, 183] },
  { elevation: 30, zenith: [66, 122, 197], horizon: [170, 198, 218] },
  { elevation: 70, zenith: [52, 108, 190], horizon: [156, 190, 216] },
];

function sampleSky(elevationDeg: number): { zenith: RGB; horizon: RGB } {
  if (elevationDeg <= SKY_STOPS[0].elevation) {
    return { zenith: SKY_STOPS[0].zenith, horizon: SKY_STOPS[0].horizon };
  }
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[i + 1];
    if (elevationDeg <= b.elevation) {
      const t = (elevationDeg - a.elevation) / (b.elevation - a.elevation);
      return {
        zenith: mix(a.zenith, b.zenith, t),
        horizon: mix(a.horizon, b.horizon, t),
      };
    }
  }
  const last = SKY_STOPS[SKY_STOPS.length - 1];
  return { zenith: last.zenith, horizon: last.horizon };
}

export type Lighting = {
  zenith: RGB;
  horizon: RGB;
  /** Warm near sunrise/sunset, neutral at noon. */
  sunColor: RGB;
  sunIntensity: number;
  moonColor: RGB;
  moonIntensity: number;
  /** Fill light on everything that is not directly lit. */
  ambient: RGB;
  ambientIntensity: number;
  starVisibility: number;
  hazeColor: RGB;
  hazeDensity: number;
  /** 0 at astronomical night, 1 in full daylight. */
  dayFactor: number;
  /** Peaks during the golden hour. */
  goldenFactor: number;
  /** Peaks during the blue hour. */
  blueFactor: number;
  /** Multiplier applied to artificial light (windows, headlights, candles). */
  artificialLight: number;
};

const SEASON_TINT: Record<Season, RGB> = {
  spring: [1.02, 1.03, 0.99],
  summer: [1.06, 1.02, 0.94],
  autumn: [1.05, 0.99, 0.92],
  winter: [0.96, 0.99, 1.06],
};

export function computeLighting(
  sunAltitudeDeg: number,
  moon: MoonInfo,
  weather: WeatherSnapshot,
  season: Season,
): Lighting {
  const base = sampleSky(sunAltitudeDeg);

  const dayFactor = smoothstep(-6, 6, sunAltitudeDeg);
  const goldenFactor =
    smoothstep(-4, 2, sunAltitudeDeg) * (1 - smoothstep(4, 12, sunAltitudeDeg));
  const blueFactor =
    smoothstep(-12, -6, sunAltitudeDeg) * (1 - smoothstep(-4, 1, sunAltitudeDeg));

  const overcast = clamp(weather.cloudCover);
  const storm = weather.condition === "storm" ? 1 : 0;
  const foggy = weather.condition === "fog" ? 1 : 0;
  const snowing = weather.condition === "snow" ? 1 : 0;

  // Clouds flatten and grey the sky, and a storm darkens it further.
  const cloudGrey: RGB = [104, 110, 120];
  const stormGrey: RGB = [46, 50, 58];
  const cloudTarget = mix(cloudGrey, stormGrey, storm);
  const cloudMix = overcast * (0.32 + 0.34 * dayFactor) + storm * 0.25;

  let zenith = mix(base.zenith, scale(cloudTarget, 0.55 + 0.45 * dayFactor), cloudMix);
  let horizon = mix(base.horizon, scale(cloudTarget, 0.7 + 0.3 * dayFactor), cloudMix * 0.9);

  const tint = SEASON_TINT[season];
  zenith = [zenith[0] * tint[0], zenith[1] * tint[1], zenith[2] * tint[2]];
  horizon = [horizon[0] * tint[0], horizon[1] * tint[1], horizon[2] * tint[2]];

  // Direct sunlight: reddened at low elevation by the longer air path.
  const sunWarm: RGB = [255, 152, 88];
  const sunNoon: RGB = [255, 246, 232];
  const sunColor = mix(sunWarm, sunNoon, smoothstep(0, 22, sunAltitudeDeg));
  const sunIntensity =
    smoothstep(-3, 8, sunAltitudeDeg) * (1 - 0.72 * overcast) * (1 - 0.5 * storm);

  const moonAltitudeDeg = (moon.altitude * 180) / Math.PI;
  const moonColor: RGB = [186, 202, 232];
  const moonIntensity =
    smoothstep(-2, 14, moonAltitudeDeg) *
    moon.illumination *
    (1 - dayFactor) *
    (1 - 0.8 * overcast);

  const skyAmbient = mix(zenith, horizon, 0.45);
  const ambient = mix(
    scale(skyAmbient, 1.35),
    mix(sunColor, moonColor, 1 - dayFactor),
    0.28,
  );
  const ambientIntensity =
    0.06 + 0.86 * dayFactor * (1 - 0.35 * overcast) + 0.1 * moonIntensity;

  const starVisibility =
    (1 - smoothstep(-16, -3, sunAltitudeDeg)) *
    (1 - 0.92 * overcast) *
    (1 - 0.55 * moonIntensity);

  const hazeColor = mix(horizon, [214, 216, 220], 0.35 * foggy + 0.2 * snowing);
  const hazeDensity = clamp(
    0.1 +
      0.55 * foggy +
      0.22 * overcast +
      0.3 * clamp(weather.humidity - 0.6, 0, 0.4) * 2.5 +
      0.18 * snowing,
    0,
    0.9,
  );

  return {
    zenith,
    horizon,
    sunColor,
    sunIntensity,
    moonColor,
    moonIntensity,
    ambient,
    ambientIntensity,
    starVisibility,
    hazeColor,
    hazeDensity,
    dayFactor,
    goldenFactor,
    blueFactor,
    artificialLight: 1 - smoothstep(-8, 2, sunAltitudeDeg),
  };
}
