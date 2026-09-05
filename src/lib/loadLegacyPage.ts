import fs from "node:fs";
import path from "node:path";

import { extractMainFragment } from "./rewriteLegacyHtml";

const LEGACY_DIR = path.join(process.cwd(), "content", "legacy");

/** Filename in content/legacy (e.g. readmore-index-center.html) */
export function loadLegacyFragment(filename: string): string {
  const filePath = path.join(LEGACY_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return extractMainFragment(raw);
}

export const LEGACY_FILES: Record<string, string> = {
  "readmore-index-center": "readmore-index-center.html",
  Kithaironas: "Kithaironas.html",
  Pefko: "Pefko.html",
  Fotia: "Fotia.html",
  Pyroprostasia: "Pyroprostasia.html",
  Newspaper: "Newspaper.html",
  Weather: "Weather.html",
  Contact: "Contact.html",
  Documents: "Documents.html",
  PPKnews: "PPKnews.html",
  "Church-news": "Church-news.html",
  "Site-Policy": "Site-Policy.html",
  Agios_Nektarios: "Agios_Nektarios.html",
  Agios_Fanourios: "Agios_Fanourios.html",
  Agia_Marina: "Agia_Marina.html",
  Hercules: "Hercules.html",
  "The-Furies": "The-Furies.html",
  Egosthena_Fortress: "Egosthena_Fortress.html",
  Eleftheres_Castle: "Eleftheres_Castle.html",
  "Under-Construction": "Under-Construction.html",
};
