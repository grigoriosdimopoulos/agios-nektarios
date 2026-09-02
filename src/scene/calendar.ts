/** Seasons and Greek/Orthodox holidays that the scene decorates itself for. */

export type Season = "spring" | "summer" | "autumn" | "winter";

export type Holiday =
  | "none"
  | "independence"
  | "ohi"
  | "christmas"
  | "newyear"
  | "easter"
  | "patron";

export function seasonOf(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

/**
 * Continuous position within the season, 0 at its start and 1 at its end.
 * Used to fade foliage colour rather than switching it overnight.
 */
export function seasonProgress(date: Date): number {
  const month = date.getMonth();
  const dayOfMonth = date.getDate();
  // Seasons start in March, so shifting by 10 months puts each season at 0..2.
  const monthInSeason = ((month + 10) % 12) % 3;
  const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();
  return (monthInSeason + (dayOfMonth - 1) / daysInMonth) / 3;
}

/** Orthodox Easter (Meeus/Julian computus, shifted to the Gregorian calendar). */
export function orthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  // Julian → Gregorian offset is 13 days for 1900–2099.
  const julian = new Date(Date.UTC(year, month - 1, day));
  julian.setUTCDate(julian.getUTCDate() + 13);
  return julian;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function withinDays(date: Date, target: Date, before: number, after: number) {
  const day = 86400000;
  const diff =
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).valueOf() -
      new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
      ).valueOf()) /
    day;
  return diff >= -before && diff <= after;
}

export function holidayOf(date: Date): Holiday {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // New Year takes precedence over the Christmas window it overlaps.
  if ((month === 11 && day >= 30) || (month === 0 && day <= 2)) return "newyear";
  if (month === 11 && day >= 15) return "christmas";
  if (month === 0 && day <= 7) return "christmas";

  const easter = orthodoxEaster(year);
  if (withinDays(date, easter, 6, 2)) return "easter";

  if (month === 2 && (day === 24 || day === 25)) return "independence";
  if (month === 9 && (day === 27 || day === 28)) return "ohi";
  if (month === 10 && (day === 8 || day === 9)) return "patron";

  return "none";
}

/** Midnight of Holy Saturday → the Resurrection, when the candles are lit. */
export function isResurrectionNight(date: Date): boolean {
  const easter = orthodoxEaster(date.getFullYear());
  const saturday = new Date(easter);
  saturday.setDate(saturday.getDate() - 1);
  const hour = date.getHours();
  return (
    (sameDay(date, saturday) && hour >= 23) ||
    (sameDay(date, easter) && hour < 2)
  );
}
