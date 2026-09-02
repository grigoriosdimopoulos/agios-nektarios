/**
 * Storage adapter for editable content and uploaded media.
 *
 * Production (Netlify): Netlify Blobs — writes are visible immediately, no rebuild.
 * Local / any other host: a plain directory on disk (`.data/` by default).
 *
 * The adapter is resolved lazily and memoised so a missing @netlify/blobs
 * install (or running outside Netlify) silently falls back to the filesystem.
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

function netlifyStore(store: NetlifyStore): ContentStore {
  return {
    async readJSON<T>(key: string) {
      const value = await store.get(safeKey(key), { type: "json" });
      return (value as T) ?? null;
    },
    async writeJSON(key, value) {
      await store.setJSON(safeKey(key), value);
    },
    async readBlob(key) {
      const entry = await store.getWithMetadata(safeKey(key), {
        type: "arrayBuffer",
      });
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
      await store.set(safeKey(key), toArrayBuffer(body), {
        metadata: { contentType },
      });
    },
    remove: (key) => store.delete(safeKey(key)),
    async list(prefix) {
      const { blobs } = await store.list({ prefix: `${safeKey(prefix)}/` });
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
    const { getStore } = await import("@netlify/blobs");
    return netlifyStore(
      getStore({ name: "agios-nektarios-content", consistency: "strong" }),
    );
  } catch (error) {
    console.warn("[store] Netlify Blobs unavailable, using filesystem:", error);
    return fileStore();
  }
}

export function getContentStore(): Promise<ContentStore> {
  cached ??= resolveStore();
  return cached;
}
