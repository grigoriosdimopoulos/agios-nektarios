import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { adminEnvReport, adminUsername, isAdminConfigured } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Σύνδεση διαχειριστή",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getSession()) redirect("/admin");

  const { next } = await searchParams;
  const target = next?.startsWith("/admin") ? next : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="font-body text-[0.6rem] uppercase tracking-[0.34em] text-[rgba(154,123,82,0.72)]">
          Άγιος Νεκτάριος
        </p>
        <h1 className="mt-3 font-display text-[2rem] font-medium leading-tight text-[var(--ivory)]">
          Διαχείριση ιστότοπου
        </h1>
        <p className="mt-3 font-body text-[0.85rem] leading-relaxed text-[rgba(232,228,214,0.45)]">
          Συνδεθείτε για να αλλάξετε κείμενα, να ανεβάσετε αρχεία και να
          ρυθμίσετε το ζωντανό σκηνικό.
        </p>

        {!isAdminConfigured() && (
          <div className="mt-6 space-y-3 rounded-[2px] border border-[rgba(226,140,130,0.35)] bg-[rgba(226,140,130,0.08)] p-4 font-body text-[0.8rem] leading-relaxed text-[rgba(226,170,160,0.95)]">
            <p>
              Δεν έχει οριστεί λογαριασμός διαχειριστή. Χρειάζεται μία από τις
              <code className="mx-1">ADMIN_PASSWORD</code> ή
              <code className="mx-1">ADMIN_PASSWORD_HASH</code>, ορατή στο
              runtime του ιστότοπου.
            </p>
            <ul className="space-y-1 font-mono text-[0.72rem]">
              {adminEnvReport().map((entry) => (
                <li key={entry.name}>
                  {entry.present ? "✓" : "✗"} {entry.name}{" "}
                  {entry.present ? "— ορίστηκε" : "— δεν φτάνει στον server"}
                </li>
              ))}
            </ul>
            <p className="text-[0.74rem] opacity-80">
              Αν όλες δείχνουν ✗: η μεταβλητή μπήκε με άλλο όνομα, ή το scope
              δεν περιλαμβάνει «Functions/Runtime», ή δεν έχει γίνει νέο deploy
              μετά την προσθήκη. Όνομα χρήστη σε χρήση: <code>{adminUsername()}</code>.
            </p>
          </div>
        )}

        <div className="mt-8">
          <LoginForm next={target} />
        </div>
      </div>
    </div>
  );
}
