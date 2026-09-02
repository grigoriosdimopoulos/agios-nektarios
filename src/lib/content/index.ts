import "server-only";

import { getContentStore } from "@/lib/store";
import { LEGACY_FILES, loadLegacyFragment } from "@/lib/loadLegacyPage";
import {
  DEFAULT_HOME,
  DEFAULT_SETTINGS,
  type HomeContent,
  type MediaItem,
  type PageContent,
  type SiteSettings,
} from "./schema";

const HOME_KEY = "content/home.json";
const SETTINGS_KEY = "content/settings.json";
const PAGE_KEY = (slug: string) => `content/pages/${slug}.json`;
const MEDIA_INDEX_KEY = "media/index.json";
const MEDIA_BLOB_KEY = (name: string) => `media/files/${name}`;

/** Human titles for the legacy pages, shown in the nav and the admin list. */
export const PAGE_TITLES: Record<string, string> = {
  "readmore-index-center": "Ο οικισμός μας — Συνέχεια",
  Newspaper: "Εφημερίδα",
  Weather: "Καιρός",
  Contact: "Επικοινωνία",
  Documents: "Καταστατικό και Πρακτικά",
  PPKnews: "ΠΠΚ — Νέα",
  "Church-news": "Νέα Ναού",
  "Site-Policy": "Πολιτική ιστότοπου",
  Agios_Nektarios: "Άγιος Νεκτάριος",
  Agios_Fanourios: "Άγιος Φανούριος",
  Agia_Marina: "Αγία Μαρίνα",
  Hercules: "Ηρακλής",
  "The-Furies": "Οι Ερινύες",
  Egosthena_Fortress: "Φρούριο Αιγοσθενών",
  Eleftheres_Castle: "Κάστρο Ελευθερών",
  "Under-Construction": "Σε εξέλιξη",
};

type Plain = Record<string, unknown>;

function isPlainObject(value: unknown): value is Plain {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

/**
 * Overlays a stored (possibly older, possibly partial) document on the
 * built-in defaults so new fields never come back undefined.
 */
export function mergeDefaults<T>(defaults: T, stored: unknown): T {
  if (!isPlainObject(stored) || !isPlainObject(defaults)) {
    return (stored === undefined || stored === null ? defaults : (stored as T));
  }
  const result: Plain = { ...defaults };
  for (const [key, value] of Object.entries(stored)) {
    if (value === undefined) continue;
    const base = (defaults as Plain)[key];
    result[key] =
      isPlainObject(base) && isPlainObject(value)
        ? mergeDefaults(base, value)
        : value;
  }
  return result as T;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings> {
  const store = await getContentStore();
  const stored = await store.readJSON<Partial<SiteSettings>>(SETTINGS_KEY);
  return mergeDefaults(DEFAULT_SETTINGS, stored);
}

export async function saveSiteSettings(next: SiteSettings): Promise<void> {
  const store = await getContentStore();
  await store.writeJSON(SETTINGS_KEY, next);
}

// ── Home page ─────────────────────────────────────────────────────────────────

export async function getHomeContent(): Promise<HomeContent> {
  const store = await getContentStore();
  const stored = await store.readJSON<Partial<HomeContent>>(HOME_KEY);
  return mergeDefaults(DEFAULT_HOME, stored);
}

export async function saveHomeContent(next: HomeContent): Promise<void> {
  const store = await getContentStore();
  await store.writeJSON(HOME_KEY, next);
}

export async function resetHomeContent(): Promise<void> {
  const store = await getContentStore();
  await store.remove(HOME_KEY);
}

// ── Legacy sub-pages ──────────────────────────────────────────────────────────

export function listPageSlugs(): string[] {
  return Object.keys(LEGACY_FILES);
}

function legacyPage(slug: string): PageContent {
  const file = LEGACY_FILES[slug];
  return {
    slug,
    title: PAGE_TITLES[slug] ?? slug,
    html: file ? loadLegacyFragment(file) : "",
    updatedAt: "",
    updatedBy: "",
  };
}

/** Stored version if the admin has edited it, otherwise the original HTML. */
export async function getPageContent(slug: string): Promise<PageContent | null> {
  if (!LEGACY_FILES[slug]) return null;
  const store = await getContentStore();
  const stored = await store.readJSON<PageContent>(PAGE_KEY(slug));
  return stored ? { ...legacyPage(slug), ...stored, slug } : legacyPage(slug);
}

export async function savePageContent(
  slug: string,
  data: { title: string; html: string },
  user: string,
): Promise<void> {
  if (!LEGACY_FILES[slug]) throw new Error(`Unknown page: ${slug}`);
  const store = await getContentStore();
  const doc: PageContent = {
    slug,
    title: data.title,
    html: data.html,
    updatedAt: new Date().toISOString(),
    updatedBy: user,
  };
  await store.writeJSON(PAGE_KEY(slug), doc);
}

export async function resetPageContent(slug: string): Promise<void> {
  const store = await getContentStore();
  await store.remove(PAGE_KEY(slug));
}

export async function listEditedPageSlugs(): Promise<Set<string>> {
  const store = await getContentStore();
  const keys = await store.list("content/pages");
  return new Set(
    keys.map((key) => key.split("/").pop()?.replace(/\.json$/, "") ?? ""),
  );
}

// ── Media library ─────────────────────────────────────────────────────────────

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
]);

export function mediaFileName(original: string): string {
  const base = original
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const stamp = Date.now().toString(36);
  return base ? `${stamp}-${base}` : `${stamp}-upload`;
}

export async function listMedia(): Promise<MediaItem[]> {
  const store = await getContentStore();
  const index = await store.readJSON<MediaItem[]>(MEDIA_INDEX_KEY);
  return Array.isArray(index) ? index : [];
}

export async function saveMedia(file: File): Promise<MediaItem> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`Μη επιτρεπτός τύπος αρχείου: ${file.type || "άγνωστος"}`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Το αρχείο ξεπερνά τα 12 MB.");
  }

  const store = await getContentStore();
  const name = mediaFileName(file.name);
  const body = Buffer.from(await file.arrayBuffer());
  await store.writeBlob(MEDIA_BLOB_KEY(name), body, file.type);

  const item: MediaItem = {
    key: name,
    name: file.name,
    url: `/api/media/${name}`,
    contentType: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
  const index = await listMedia();
  await store.writeJSON(MEDIA_INDEX_KEY, [item, ...index]);
  return item;
}

export async function deleteMedia(key: string): Promise<void> {
  const store = await getContentStore();
  await store.remove(MEDIA_BLOB_KEY(key));
  const index = await listMedia();
  await store.writeJSON(
    MEDIA_INDEX_KEY,
    index.filter((item) => item.key !== key),
  );
}

export async function readMedia(key: string) {
  const store = await getContentStore();
  return store.readBlob(MEDIA_BLOB_KEY(key));
}
