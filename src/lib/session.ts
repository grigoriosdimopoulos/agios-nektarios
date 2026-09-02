import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./auth";

/** Reads the signed admin session from the request cookies. */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Server actions call this before writing anything. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Απαιτείται σύνδεση διαχειριστή.");
  return session;
}
