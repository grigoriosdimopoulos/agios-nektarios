import Link from "next/link";
import type { ReactNode } from "react";

import { getSession } from "@/lib/session";
import { logoutAction } from "./actions";
import { ghostButtonClass } from "./ui";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Επισκόπηση" },
  { href: "/admin/home", label: "Αρχική σελίδα" },
  { href: "/admin/pages", label: "Σελίδες" },
  { href: "/admin/media", label: "Αρχεία" },
  { href: "/admin/scene", label: "Σκηνικό & ρυθμίσεις" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  // The login screen lives under /admin but renders without the chrome.
  if (!session) {
    return (
      <div className="min-h-screen bg-[#08090b] text-[rgba(232,228,214,0.8)]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090b] text-[rgba(232,228,214,0.8)]">
      <header className="border-b border-[rgba(232,228,214,0.07)] bg-[rgba(10,12,15,0.9)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 md:px-8">
          <Link
            href="/admin"
            className="font-display text-[1.05rem] font-medium text-[var(--ivory)]"
          >
            Διαχείριση
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-body text-[0.7rem] uppercase tracking-[0.22em] text-[rgba(232,228,214,0.45)] transition hover:text-[var(--ivory)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="font-body text-[0.7rem] uppercase tracking-[0.22em] text-[rgba(232,228,214,0.4)] transition hover:text-[var(--ivory)]"
            >
              Ιστότοπος ↗
            </Link>
            <form action={logoutAction}>
              <button type="submit" className={ghostButtonClass}>
                Αποσύνδεση
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-8 px-5 py-10 md:px-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
