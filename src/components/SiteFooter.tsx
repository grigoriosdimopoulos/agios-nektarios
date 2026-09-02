import Link from "next/link";

import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/content/schema";

export function SiteFooter({
  settings = DEFAULT_SETTINGS,
}: {
  settings?: SiteSettings;
}) {
  return (
    <footer className="border-t border-[rgba(232,228,214,0.048)] bg-gradient-to-b from-[rgba(9,11,13,0.94)] to-[rgba(7,8,9,0.97)] px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-start gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-[1.6rem] font-medium tracking-tight text-[rgba(232,228,214,0.82)] md:text-[2rem]">
              {settings.siteTitle}
            </p>
            <p className="mt-2 font-body text-sm text-[rgba(232,228,214,0.32)]">
              {settings.tagline} · Κιθαιρώνας · Δυτική Αττική
            </p>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <a
              href={`mailto:${settings.email}`}
              className="font-body text-[0.82rem] text-[rgba(232,228,214,0.4)] transition hover:text-[rgba(232,228,214,0.72)]"
            >
              {settings.email}
            </a>
            <p className="font-body text-[0.7rem] text-[rgba(232,228,214,0.22)]">
              Βίλια 19012
            </p>
          </div>
        </div>

        <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-[rgba(154,123,82,0.22)] to-transparent" />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl font-body text-[0.72rem] text-[rgba(232,228,214,0.28)]">
            © 2009–{new Date().getFullYear()} {settings.footerNote}
          </p>
          <div className="flex gap-4">
            <Link
              href="/Site-Policy"
              className="font-body text-[0.72rem] text-[rgba(232,228,214,0.28)] transition hover:text-[rgba(232,228,214,0.55)]"
            >
              Πολιτική ιστότοπου
            </Link>
            <Link
              href="/admin"
              className="font-body text-[0.72rem] text-[rgba(232,228,214,0.18)] transition hover:text-[rgba(232,228,214,0.45)]"
            >
              Διαχείριση
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
