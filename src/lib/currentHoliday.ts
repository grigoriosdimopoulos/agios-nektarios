import type { SiteSettings } from "@/lib/content/schema";
import { holidayOf, type Holiday } from "@/scene/calendar";

/** The feast day in force, honouring the administrator's override. */
export function currentHoliday(settings: SiteSettings): Holiday {
  if (!settings.scene.holidayThemes) return "none";
  const override = settings.scene.override.holiday;
  return override === "" ? holidayOf(new Date()) : (override as Holiday);
}
