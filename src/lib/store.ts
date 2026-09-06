/**
 * Storage adapter for editable content and uploaded media.
 *
 * Production (Netlify): Netlify Blobs — writes are visible immediately, no rebuild.
 * Local / any other host: a plain directory on disk (`.data/` by default).
 *
 * The adapter is resolved lazily and memoised so a missing @netlify/blobs
 * install (or running outside Netlify) silently falls back to the filesystem.
 *
 * The Blobs *client*, however, is deliberately NOT memoised. Netlify injects
 * short-lived credentials into the environment, so a client built once and kept
 * on a warm serverless instance starts failing with "Token expired" after an
 * hour or so — which is exactly what an editor hits when they leave the admin
 * page open and then press save. Building a client per call is cheap and always
 * reads the credentials that are valid right now.
 */
import fs from "node:fs/promises";
import path from "node:path";

export type StoredBlob = { body: Buffer; contentType: string };

export interface ContentStore {
  readJSON<T>(key: string): Promise<T | null>;
  writeJSON(key: string, value: unknown): Promise<void>;
  readBlob(key: string): Promise<StoredBlob | null>;
  writeBlob(key: string, body: Buffer, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

const DATA_DIR = process.env.CONTENT_DATA_DIR
  ? path.resolve(process.env.CONTENT_DATA_DIR)
  : path.join(process.cwd(), ".data");

/** Keys are slash-separated; keep them inside the data dir. */
function safeKey(key: string): string {
  const cleaned = key
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
  if (!cleaned) throw new Error("Empty storage key");
  return cleaned;
}

function fileStore(): ContentStore {
  const filePath = (key: string) => path.join(DATA_DIR, safeKey(key));

  return {
    async readJSON<T>(key: string) {
      try {
        return JSON.parse(await fs.readFile(filePath(key), "utf-8")) as T;
      } catch {
        return null;
      }
    },
    async writeJSON(key, value) {
      const target = filePath(key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, JSON.stringify(value, null, 2), "utf-8");
    },
    async readBlob(key) {
      try {
        const target = filePath(key);
        const [body, meta] = await Promise.all([
          fs.readFile(target),
          fs
            .readFile(`${target}.type`, "utf-8")
            .catch(() => "application/octet-stream"),
        ]);
        return { body, contentType: meta.trim() };
      } catch {
        return null;
      }
    },
    async writeBlob(key, body, contentType) {
      const target = filePath(key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, body);
      await fs.writeFile(`${target}.type`, contentType, "utf-8");
    },
    async remove(key) {
      const target = filePath(key);
      await fs.rm(target, { force: true });
      await fs.rm(`${target}.type`, { force: true });
    },
    async list(prefix) {
      const root = path.join(DATA_DIR, safeKey(prefix));
      try {
        const entries = await fs.readdir(root, { withFileTypes: true });
        return entries
          .filter((e) => e.isFile() && !e.name.endsWith(".type"))
          .map((e) => `${safeKey(prefix)}/${e.name}`);
      } catch {
        return [];
      }
    },
  };
}

type NetlifyStore = import("@netlify/blobs").Store;

const STORE_NAME = "agios-nektarios-content";

/**
 * A long-lived personal access token, if one is configured. Without it we rely
 * on the credentials Netlify injects per request, which expire.
 */
function explicitCredentials(): { siteID: string; token: string } | null {
  const siteID = process.env.NETLIFY_SITE_ID ?? process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN ?? process.env.NETLIFY_API_TOKEN;
  return siteID && token ? { siteID, token } : null;
}

/** A client built from whatever credentials are valid at this moment. */
async function freshStore(): Promise<NetlifyStore> {
  const { getStore } = await import("@netlify/blobs");
  const credentials = explicitCredentials();
  return getStore({
    name: STORE_NAME,
    consistency: "strong",
    ...(credentials ?? {}),
  });
}

/** Turns the SDK's cryptic credential errors into something an editor can act on. */
function describeFailure(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/token|credential|unauthor|expired|403|401/i.test(message)) {
    return new Error(
      "Η αποθήκευση απέτυχε: τα διαπιστευτήρια του Netlify Blobs έληξαν. " +
        "Ορίστε NETLIFY_SITE_ID και NETLIFY_API_TOKEN στις μεταβλητές " +
        "περιβάλλοντος του Netlify και κάντε redeploy. " +
        `(${message})`,
    );
  }
  return error instanceof Error ? error : new Error(message);
}

async function withStore<T>(run: (store: NetlifyStore) => Promise<T>): Promise<T> {
  try {
    return await run(await freshStore());
  } catch (error) {
    throw describeFailure(error);
  }
}

function netlifyStore(): ContentStore {
  return {
    async readJSON<T>(key: string) {
      const value = await withStore((s) => s.get(safeKey(key), { type: "json" }));
      return (value as T) ?? null;
    },
    async writeJSON(key, value) {
      await withStore((s) => s.setJSON(safeKey(key), value));
    },
    async readBlob(key) {
      const entry = await withStore((s) =>
        s.getWithMetadata(safeKey(key), { type: "arrayBuffer" }),
      );
      if (!entry?.data) return null;
      return {
        body: Buffer.from(entry.data),
        contentType:
          typeof entry.metadata?.contentType === "string"
            ? entry.metadata.contentType
            : "application/octet-stream",
      };
    },
    async writeBlob(key, body, contentType) {
      await withStore((s) =>
        s.set(safeKey(key), toArrayBuffer(body), { metadata: { contentType } }),
      );
    },
    async remove(key) {
      await withStore((s) => s.delete(safeKey(key)));
    },
    async list(prefix) {
      const { blobs } = await withStore((s) =>
        s.list({ prefix: `${safeKey(prefix)}/` }),
      );
      return blobs.map((b) => b.key);
    },
  };
}

function toArrayBuffer(body: Buffer): ArrayBuffer {
  const copy = new ArrayBuffer(body.byteLength);
  new Uint8Array(copy).set(body);
  return copy;
}

let cached: Promise<ContentStore> | null = null;

async function resolveStore(): Promise<ContentStore> {
  const onNetlify =
    Boolean(process.env.NETLIFY_BLOBS_CONTEXT) ||
    process.env.NETLIFY === "true";
  if (!onNetlify) return fileStore();

  try {
    await import("@netlify/blobs");
    return netlifyStore();
  } catch (error) {
    console.warn("[store] Netlify Blobs unavailable, using filesystem:", error);
    return fileStore();
  }
}

export function getContentStore(): Promise<ContentStore> {
  cached ??= resolveStore();
  return cached;
}
