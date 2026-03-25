import Link from "next/link";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { LegacyHtmlBody } from "./LegacyHtmlBody";
import { SiteFooter } from "./SiteFooter";

type Props = { html: string };

export function SubpageShell({ html }: Props) {
  return (
    <>
      <AmbientBackdrop variant="subtle" />
      {/* Minimal subpage header — just brand + back link */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 pt-5 md:px-10 md:pt-6">
        <Link
          href="/"
          className="font-display text-[0.92rem] font-medium tracking-tight text-[var(--ivory)] opacity-85 transition hover:opacity-100"
        >
          Άγιος Νεκτάριος
        </Link>
        <Link
          href="/"
          className="font-body text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(232,228,214,0.4)] transition hover:text-[rgba(232,228,214,0.75)]"
        >
          ← Αρχική
        </Link>
      </header>
      <main className="min-h-[60vh] bg-[linear-gradient(180deg,#0e1013_0%,#08090b_100%)] pt-24 md:pt-28">
        <LegacyHtmlBody html={html} />
      </main>
      <SiteFooter />
    </>
  );
}
