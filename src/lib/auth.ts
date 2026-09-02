/**
 * Admin authentication.
 *
 * One administrator account, configured entirely through environment variables:
 *
 *   ADMIN_USERNAME        optional, defaults to "admin"
 *   ADMIN_PASSWORD_HASH   preferred — "scrypt:<saltHex>:<hashHex>"
 *   ADMIN_PASSWORD        plain-text alternative (simpler, less safe)
 *   ADMIN_SESSION_SECRET  signing key for the session cookie
 *
 * Sessions are stateless: a base64url payload plus an HMAC-SHA256 signature,
 * verified with Web Crypto so the same code runs in `proxy.ts` and on the server.
 */
import { scrypt as scryptCb, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "an_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type SessionPayload = { sub: string; iat: number; exp: number };

function encode(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}

function sessionSecret(): string {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= 16) return explicit;
  // Fall back to deriving from the credential so a single env var is enough.
  const derived = process.env.ADMIN_PASSWORD_HASH ?? process.env.ADMIN_PASSWORD;
  if (derived) return `derived:${derived}`;
  return "insecure-development-secret-change-me";
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return Buffer.from(signature).toString("base64url");
}

export async function createSessionToken(username: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: username,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const body = encode(JSON.stringify(payload));
  return `${body}.${await hmac(body)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = await hmac(body);
  if (expected.length !== signature.length) return null;
  if (
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(body)) as SessionPayload;
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function adminUsername(): string {
  return process.env.ADMIN_USERNAME?.trim() || "admin";
}

/** True when at least one credential env var is present. */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD);
}

/** Builds the value for ADMIN_PASSWORD_HASH from a plain password. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  if (!constantTimeEquals(username.trim(), adminUsername())) return false;

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    const [scheme, saltHex, digestHex] = hash.split(":");
    if (scheme !== "scrypt" || !saltHex || !digestHex) return false;
    const derived = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
    return constantTimeEquals(derived.toString("hex"), digestHex);
  }

  const plain = process.env.ADMIN_PASSWORD;
  return Boolean(plain) && constantTimeEquals(password, plain as string);
}

/** Simple in-process throttle — enough to blunt password guessing. */
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

export function tooManyAttempts(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
