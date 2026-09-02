import { getSiteSettings } from "@/lib/content";
import { FALLBACK_WEATHER, normalizeOpenMeteo } from "@/scene/weather";

/** Cached for ten minutes — the village weather does not change faster. */
export const revalidate = 600;

const FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "is_day",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
].join(",");

export async function GET() {
  const settings = await getSiteSettings();

  if (!settings.scene.liveWeather) {
    return Response.json(FALLBACK_WEATHER, {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${settings.scene.latitude}` +
    `&longitude=${settings.scene.longitude}` +
    `&current=${FIELDS}&timezone=auto`;

  try {
    const response = await fetch(url, { next: { revalidate: 600 } });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const data = (await response.json()) as { current?: Record<string, number> };
    return Response.json(normalizeOpenMeteo(data.current ?? {}), {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  } catch (error) {
    console.warn("[weather] falling back:", error);
    return Response.json(FALLBACK_WEATHER, {
      headers: { "Cache-Control": "public, max-age=120" },
    });
  }
}
