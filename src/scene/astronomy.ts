/**
 * Sun and moon positions for a fixed place on Earth.
 *
 * Low-precision formulae (Meeus, "Astronomical Algorithms", ch. 25 and 47).
 * Accurate to a few arc-minutes — far beyond what the scene needs, but it means
 * sunrise, golden hour, moonrise and the moon's phase all line up with reality.
 */
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = 23.4397 * RAD;

export type SkyBody = {
  /** Radians above the horizon; negative when below. */
  altitude: number;
  /** Radians, measured from south, turning west. */
  azimuth: number;
};

export type MoonInfo = SkyBody & {
  /** 0 = new, 0.5 = full, 1 = new again. */
  phase: number;
  /** 0–1 lit fraction of the disc. */
  illumination: number;
  /** Radians — orientation of the bright limb. */
  angle: number;
};

function toJulian(date: Date): number {
  return date.valueOf() / 86400000 - 0.5 + J1970;
}

function daysSinceJ2000(date: Date): number {
  return toJulian(date) - J2000;
}

function rightAscension(eclipticLon: number, eclipticLat: number): number {
  return Math.atan2(
    Math.sin(eclipticLon) * Math.cos(OBLIQUITY) -
      Math.tan(eclipticLat) * Math.sin(OBLIQUITY),
    Math.cos(eclipticLon),
  );
}

function declination(eclipticLon: number, eclipticLat: number): number {
  return Math.asin(
    Math.sin(eclipticLat) * Math.cos(OBLIQUITY) +
      Math.cos(eclipticLat) * Math.sin(OBLIQUITY) * Math.sin(eclipticLon),
  );
}

function siderealTime(days: number, westLongitude: number): number {
  return RAD * (280.16 + 360.9856235 * days) - westLongitude;
}

function altitude(hourAngle: number, latitude: number, dec: number): number {
  return Math.asin(
    Math.sin(latitude) * Math.sin(dec) +
      Math.cos(latitude) * Math.cos(dec) * Math.cos(hourAngle),
  );
}

function azimuth(hourAngle: number, latitude: number, dec: number): number {
  return Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitude) -
      Math.tan(dec) * Math.cos(latitude),
  );
}

function solarMeanAnomaly(days: number): number {
  return RAD * (357.5291 + 0.98560028 * days);
}

function eclipticLongitude(meanAnomaly: number): number {
  const center =
    RAD *
    (1.9148 * Math.sin(meanAnomaly) +
      0.02 * Math.sin(2 * meanAnomaly) +
      0.0003 * Math.sin(3 * meanAnomaly));
  const perihelion = RAD * 102.9372;
  return meanAnomaly + center + perihelion + Math.PI;
}

export function sunPosition(
  date: Date,
  latitudeDeg: number,
  longitudeDeg: number,
): SkyBody {
  const west = -longitudeDeg * RAD;
  const phi = latitudeDeg * RAD;
  const days = daysSinceJ2000(date);

  const meanAnomaly = solarMeanAnomaly(days);
  const lon = eclipticLongitude(meanAnomaly);
  const dec = declination(lon, 0);
  const ra = rightAscension(lon, 0);
  const hourAngle = siderealTime(days, west) - ra;

  return {
    altitude: altitude(hourAngle, phi, dec),
    azimuth: azimuth(hourAngle, phi, dec),
  };
}

export function moonPosition(
  date: Date,
  latitudeDeg: number,
  longitudeDeg: number,
): MoonInfo {
  const west = -longitudeDeg * RAD;
  const phi = latitudeDeg * RAD;
  const days = daysSinceJ2000(date);

  // Geocentric ecliptic coordinates of the Moon (low precision).
  const eclipticLon = RAD * (218.316 + 13.176396 * days);
  const meanAnomaly = RAD * (134.963 + 13.064993 * days);
  const meanDistance = RAD * (93.272 + 13.22935 * days);

  const lon = eclipticLon + RAD * 6.289 * Math.sin(meanAnomaly);
  const lat = RAD * 5.128 * Math.sin(meanDistance);
  const distance = 385001 - 20905 * Math.cos(meanAnomaly);

  const ra = rightAscension(lon, lat);
  const dec = declination(lon, lat);
  const hourAngle = siderealTime(days, west) - ra;

  // Phase: elongation from the Sun.
  const sunMeanAnomaly = solarMeanAnomaly(days);
  const sunLon = eclipticLongitude(sunMeanAnomaly);
  const sunDistance = 149598000;

  const elongation = Math.acos(
    Math.cos(lat) * Math.cos(lon - sunLon),
  );
  const phaseAngle = Math.atan2(
    sunDistance * Math.sin(elongation),
    distance - sunDistance * Math.cos(elongation),
  );
  const illumination = (1 + Math.cos(phaseAngle)) / 2;
  const phase =
    0.5 +
    (0.5 * phaseAngle * Math.sign(Math.sin(lon - sunLon))) / Math.PI;

  return {
    altitude: altitude(hourAngle, phi, dec),
    azimuth: azimuth(hourAngle, phi, dec),
    phase: ((phase % 1) + 1) % 1,
    illumination,
    angle: Math.atan2(
      Math.cos(dec) * Math.sin(hourAngle),
      Math.sin(dec) * Math.cos(phi) -
        Math.cos(dec) * Math.sin(phi) * Math.cos(hourAngle),
    ),
  };
}

export const degrees = (radians: number) => radians * DEG;
