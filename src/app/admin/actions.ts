"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE,
  clearAttempts,
  createSessionToken,
  isAdminConfigured,
  recordFailedAttempt,
  tooManyAttempts,
  verifyCredentials,
} from "@/lib/auth";
import { requireSession } from "@/lib/session";
import type { ActionState } from "./action-state";
import { sanitizeHtml, sanitizeText } from "@/lib/sanitizeHtml";
import {
  deleteMedia,
  resetHomeContent,
  resetPageContent,
  saveHomeContent,
  savePageContent,
  saveMedia,
  saveSiteSettings,
  mergeDefaults,
} from "@/lib/content";
import {
  DEFAULT_HOME,
  DEFAULT_SETTINGS,
  type HomeContent,
  type SiteSettings,
} from "@/lib/content/schema";

function safeRedirectTarget(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  return raw.startsWith("/admin") && !raw.startsWith("//") ? raw : "/admin";
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isAdminConfigured()) {
    return {
      ok: false,
      message:
        "Δεν έχει οριστεί λογαριασμός διαχειριστή. Ορίστε ADMIN_PASSWORD_HASH στις μεταβλητές περιβάλλοντος.",
    };
  }

  const headerList = await headers();
  const throttleKey =
    headerList.get("x-nf-client-connection-ip") ??
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (tooManyAttempts(throttleKey)) {
    return {
      ok: false,
      message: "Πολλές αποτυχημένες προσπάθειες. Δοκιμάστε ξανά σε λίγο.",
    };
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!(await verifyCredentials(username, password))) {
    recordFailedAttempt(throttleKey);
    return { ok: false, message: "Λάθος όνομα χρήστη ή κωδικός." };
  }

  clearAttempts(throttleKey);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(safeRedirectTarget(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ── Sub-pages ─────────────────────────────────────────────────────────────────

export async function savePageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const slug = String(formData.get("slug") ?? "");
  const title = sanitizeText(String(formData.get("title") ?? ""));
  const html = sanitizeHtml(String(formData.get("html") ?? ""));

  if (!title) return { ok: false, message: "Ο τίτλος δεν μπορεί να είναι κενός." };

  try {
    await savePageContent(slug, { title, html }, session.sub);
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
  refresh();
  return { ok: true, message: "Η σελίδα αποθηκεύτηκε." };
}

export async function resetPageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  await resetPageContent(String(formData.get("slug") ?? ""));
  refresh();
  return { ok: true, message: "Επαναφορά στο αρχικό κείμενο." };
}

// ── Home page ─────────────────────────────────────────────────────────────────

function sanitizeHome(input: HomeContent): HomeContent {
  return {
    ...input,
    settlement: {
      ...input.settlement,
      paragraphs: input.settlement.paragraphs
        .map((p) => sanitizeText(p))
        .filter(Boolean),
    },
  };
}

export async function saveHomeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  try {
    const parsed = JSON.parse(String(formData.get("payload") ?? "{}"));
    const merged = mergeDefaults(DEFAULT_HOME, parsed);
    await saveHomeContent(sanitizeHome(merged));
  } catch (error) {
    return { ok: false, message: `Αποτυχία αποθήκευσης: ${(error as Error).message}` };
  }
  refresh();
  return { ok: true, message: "Η αρχική σελίδα ενημερώθηκε." };
}

export async function resetHomeAction(): Promise<ActionState> {
  await requireSession();
  await resetHomeContent();
  refresh();
  return { ok: true, message: "Η αρχική σελίδα επανήλθε στις αρχικές τιμές." };
}

// ── Settings & scene ──────────────────────────────────────────────────────────

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  try {
    const parsed = JSON.parse(String(formData.get("payload") ?? "{}"));
    const merged: SiteSettings = mergeDefaults(DEFAULT_SETTINGS, parsed);
    merged.scene.intensity = Math.min(1, Math.max(0, merged.scene.intensity));
    await saveSiteSettings(merged);
  } catch (error) {
    return { ok: false, message: `Αποτυχία αποθήκευσης: ${(error as Error).message}` };
  }
  refresh();
  return { ok: true, message: "Οι ρυθμίσεις αποθηκεύτηκαν." };
}

// ── Media ─────────────────────────────────────────────────────────────────────

export async function uploadMediaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  const usable = files.filter((f) => f.size > 0);
  if (usable.length === 0) return { ok: false, message: "Δεν επιλέχθηκε αρχείο." };

  try {
    for (const file of usable) await saveMedia(file);
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
  refresh();
  const noun = usable.length === 1 ? "αρχείο" : "αρχεία";
  return { ok: true, message: `Ανέβηκαν ${usable.length} ${noun}.` };
}

export async function deleteMediaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  await deleteMedia(String(formData.get("key") ?? ""));
  refresh();
  return { ok: true, message: "Το αρχείο διαγράφηκε." };
}
