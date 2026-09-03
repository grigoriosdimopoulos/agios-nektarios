import Link from "next/link";

import type { SiteSettings } from "@/lib/content/schema";
import { currentHoliday } from "@/lib/currentHoliday";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { HolidayDressing } from "./HolidayDressing";
import { LegacyHtmlBody } from "./LegacyHtmlBody";
import { LivingScene } from "./LivingScene";
import { SiteFooter } from "./SiteFooter";

type Props = { html: string; settings: SiteSettings };

export function SubpageShell({ html, settings }: Props) {
  const sceneEnabled = settings.scene.enabled;

  return (
    <>
      {sceneEnabled ? (
        <LivingScene settings={{ ...settings.scene, intensity: settings.scene.intensity * 0.6 }} />
      ) : (
        <AmbientBackdrop variant="subtle" />
      )}
      <HolidayDressing holiday={currentHoliday(settings)} />
      {/* Minimal subpage header — just brand + back link */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-[linear-gradient(180deg,rgba(7,8,9,0.75),transparent)] px-6 pb-6 pt-5 md:px-10 md:pt-6">
        <Link
          href="/"
          className="font-display text-[0.92rem] font-medium tracking-tight text-[var(--ivory)] opacity-85 transition hover:opacity-100"
        >
          {settings.siteTitle}
        </Link>
        <Link
          href="/"
          className="font-body text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(232,228,214,0.4)] transition hover:text-[rgba(232,228,214,0.75)]"
        >
          ← Αρχική
        </Link>
      </header>
      <main className="min-h-[60vh] bg-[linear-gradient(180deg,rgba(14,16,19,0.92)_0%,rgba(8,9,11,0.95)_100%)] pt-24 md:pt-28">
        <LegacyHtmlBody html={html} />
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
