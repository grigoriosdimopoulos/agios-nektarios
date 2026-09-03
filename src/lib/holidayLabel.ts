import type { Holiday } from "@/scene/calendar";

export type HolidayBadge = { label: string; accent: string };

/**
 * A feast day cannot be painted into a photograph without looking pasted on,
 * so it is marked in the page instead: a line above the title, and the colour
 * of the village's windows after dark.
 */
export const HOLIDAY_BADGES: Record<Holiday, HolidayBadge | null> = {
  none: null,
  independence: {
    label: "25 Μαρτίου 1821 — Εθνική επέτειος",
    accent: "linear-gradient(90deg,#0d5eaf,#f4f6f8,#0d5eaf)",
  },
  ohi: {
    label: "28 Οκτωβρίου 1940 — Επέτειος του «Όχι»",
    accent: "linear-gradient(90deg,#0d5eaf,#f4f6f8,#0d5eaf)",
  },
  christmas: {
    label: "Καλά Χριστούγεννα",
    accent: "linear-gradient(90deg,rgba(214,86,72,0.9),rgba(240,206,140,0.9))",
  },
  newyear: {
    label: "Καλή χρονιά",
    accent: "linear-gradient(90deg,rgba(240,206,140,0.9),rgba(232,228,214,0.6))",
  },
  easter: {
    label: "Καλό Πάσχα — Χριστός Ανέστη",
    accent: "linear-gradient(90deg,rgba(240,206,140,0.95),rgba(196,90,74,0.85))",
  },
  patron: {
    label: "9 Νοεμβρίου — Του Αγίου Νεκταρίου",
    accent: "linear-gradient(90deg,rgba(154,123,82,0.9),rgba(240,206,140,0.8))",
  },
};
