"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const PRIMARY = [
  { href: "/", label: "Αρχική" },
  { href: "/Newspaper", label: "Εφημερίδα" },
  { href: "/Weather", label: "Καιρός" },
  { href: "/Contact", label: "Επικοινωνία" },
];

const SIDEBAR_NEWS = [
  {
    href: "/PPKnews",
    label: "Πνευματικό & Πολιτιστικό Κέντρο (ΠΠΚ)",
  },
  { href: "/Church-news", label: "Νέα Τρίκλιτου Ναού" },
  {
    href: "https://mandras-eidyllias.gr/",
    label: "Νέα Δήμου",
    external: true,
  },
  {
    href: "https://www.agiosnektarios.gr/Settlers-registration.doc",
    label: "Μητρώο Οικιστών",
    external: true,
  },
  { href: "/Documents", label: "Καταστατικό & Πρακτικά" },
];

const FOLKLORE = [
  { href: "/Agios_Nektarios", label: "Άγιος Νεκτάριος" },
  { href: "/Agios_Fanourios", label: "Άγιος Φανούριος" },
  { href: "/Agia_Marina", label: "Αγία Μαρίνα" },
  { href: "/Under-Construction", label: "Όσιος Μελέτιος" },
  { href: "/Hercules", label: "Ηρακλής" },
  { href: "/The-Furies", label: "Ερινύες" },
  { href: "/Egosthena_Fortress", label: "Φρούριο Αιγοσθενών" },
  { href: "/Eleftheres_Castle", label: "Κάστρο Ελευθερών" },
  { href: "/Under-Construction", label: "Κιθαιρώνας" },
];

type Props = {
  visible: boolean;
  /** Home: glass over video until user scrolls past hero. Inner pages: always solid bar. */
  variant?: "home" | "page";
};

export function SiteNav({ visible, variant = "page" }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pastHero, setPastHero] = useState(variant === "page");
  const moreRef = useRef<HTMLDivElement>(null);

  const updatePastHero = useCallback(() => {
    if (variant !== "home") {
      setPastHero(true);
      return;
    }
    const el = document.querySelector<HTMLElement>("[data-hero-section]");
    if (!el) return;
    const bottom = el.getBoundingClientRect().bottom;
    setPastHero(bottom < 96);
  }, [variant]);

  useEffect(() => {
    if (!visible || variant !== "home") return;
    const id = requestAnimationFrame(() => updatePastHero());
    window.addEventListener("scroll", updatePastHero, { passive: true });
    window.addEventListener("resize", updatePastHero, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", updatePastHero);
      window.removeEventListener("resize", updatePastHero);
    };
  }, [visible, variant, updatePastHero]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [moreOpen]);

  const glassOnHero = variant === "home" && visible && !pastHero;

  const shellClass = glassOnHero
    ? "border border-[rgba(232,228,214,0.1)] bg-[rgba(7,8,9,0.42)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
    : "border border-[rgba(232,228,214,0.08)] bg-[rgba(12,14,17,0.88)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl";

  const linkClass = (active: boolean) =>
    [
      "relative rounded-full px-3.5 py-2 font-body text-[0.8125rem] font-medium tracking-wide transition-colors duration-500 md:text-sm",
      glassOnHero
        ? active
          ? "bg-[rgba(232,228,214,0.12)] text-[var(--ivory)]"
          : "text-[rgba(232,228,214,0.72)] hover:bg-[rgba(232,228,214,0.06)] hover:text-[var(--ivory)]"
        : active
          ? "bg-[rgba(232,228,214,0.1)] text-[var(--ivory)]"
          : "text-[rgba(232,228,214,0.55)] hover:bg-[rgba(232,228,214,0.06)] hover:text-[rgba(232,228,214,0.88)]",
    ].join(" ");

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          role="navigation"
          aria-label="Κύρια πλοήγηση"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 md:px-6 md:pt-5"
        >
          <div
            className={`pointer-events-auto w-full max-w-6xl rounded-[1.35rem] transition-all duration-500 ease-out ${shellClass}`}
          >
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 md:px-5 md:py-3">
              <Link
                href="/"
                className={`shrink-0 font-display text-[0.95rem] font-medium tracking-tight text-[var(--ivory)] transition-opacity duration-500 md:text-base ${
                  glassOnHero ? "opacity-95" : "opacity-90"
                }`}
              >
                Άγιος Νεκτάριος
              </Link>

              <nav className="hidden items-center gap-0.5 md:flex" aria-label="Κύριο μενού">
                {PRIMARY.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} className={linkClass(active)}>
                      {item.label}
                    </Link>
                  );
                })}

                <div className="relative" ref={moreRef}>
                  <button
                    type="button"
                    aria-expanded={moreOpen}
                    onClick={() => setMoreOpen((o) => !o)}
                    className={`flex items-center gap-1 rounded-full px-3.5 py-2 font-body text-[0.8125rem] font-medium tracking-wide transition-colors duration-500 md:text-sm ${
                      glassOnHero
                        ? "text-[rgba(232,228,214,0.72)] hover:bg-[rgba(232,228,214,0.06)]"
                        : "text-[rgba(232,228,214,0.55)] hover:bg-[rgba(232,228,214,0.05)]"
                    }`}
                  >
                    Περισσότερα
                    <Chevron className={moreOpen ? "rotate-180" : ""} />
                  </button>
                  <AnimatePresence>
                    {moreOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(90vw,22rem)] rounded-sm border border-[rgba(232,228,214,0.1)] bg-[rgba(14,16,19,0.96)] p-4 shadow-[0_32px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl"
                      >
                        <p className="mb-2 font-body text-[0.65rem] font-medium uppercase tracking-[0.22em] text-[rgba(232,228,214,0.35)]">
                          Τα νέα μας
                        </p>
                        <ul className="space-y-1 border-b border-[rgba(232,228,214,0.06)] pb-3">
                          {SIDEBAR_NEWS.map((l) => (
                            <li key={l.href}>
                              {l.external ? (
                                <a
                                  href={l.href}
                                  className="block rounded-sm px-2 py-1.5 font-body text-sm text-[rgba(232,228,214,0.78)] transition hover:bg-[rgba(232,228,214,0.05)]"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setMoreOpen(false)}
                                >
                                  {l.label}
                                </a>
                              ) : (
                                <Link
                                  href={l.href}
                                  className="block rounded-sm px-2 py-1.5 font-body text-sm text-[rgba(232,228,214,0.78)] transition hover:bg-[rgba(232,228,214,0.05)]"
                                  onClick={() => setMoreOpen(false)}
                                >
                                  {l.label}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                        <p className="mb-2 mt-3 font-body text-[0.65rem] font-medium uppercase tracking-[0.22em] text-[rgba(232,228,214,0.35)]">
                          Λαογραφικά
                        </p>
                        <ul className="max-h-48 space-y-0.5 overflow-y-auto pr-1">
                          {FOLKLORE.map((l) => (
                            <li key={`${l.href}-${l.label}`}>
                              <Link
                                href={l.href}
                                className="block rounded-sm px-2 py-1 font-body text-[0.8125rem] text-[rgba(232,228,214,0.65)] transition hover:bg-[rgba(232,228,214,0.05)] hover:text-[rgba(232,228,214,0.9)]"
                                onClick={() => setMoreOpen(false)}
                              >
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              <button
                type="button"
                className={`rounded-full border px-3 py-2 font-body text-sm transition-colors duration-500 md:hidden ${
                  glassOnHero
                    ? "border-[rgba(232,228,214,0.15)] text-[rgba(232,228,214,0.85)] hover:bg-[rgba(232,228,214,0.06)]"
                    : "border-[rgba(232,228,214,0.1)] text-[rgba(232,228,214,0.75)] hover:bg-[rgba(232,228,214,0.05)]"
                }`}
                onClick={() => setMobileOpen((o) => !o)}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? "Κλείσιμο" : "Μενού"}
              </button>
            </div>

            <AnimatePresence>
              {mobileOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-[rgba(232,228,214,0.08)] md:hidden"
                >
                  <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 py-4">
                    <ul className="space-y-1">
                      {PRIMARY.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="block rounded-sm px-3 py-2.5 font-body text-sm text-[rgba(232,228,214,0.82)] transition hover:bg-[rgba(232,228,214,0.05)]"
                            onClick={() => setMobileOpen(false)}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div>
                      <p className="mb-1 font-body text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[rgba(232,228,214,0.35)]">
                        Νέα
                      </p>
                      <ul className="space-y-1">
                        {SIDEBAR_NEWS.map((l) => (
                          <li key={l.href}>
                            {l.external ? (
                              <a
                                href={l.href}
                                className="block rounded-sm px-3 py-2 font-body text-sm text-[rgba(232,228,214,0.65)]"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileOpen(false)}
                              >
                                {l.label}
                              </a>
                            ) : (
                              <Link
                                href={l.href}
                                className="block rounded-sm px-3 py-2 font-body text-sm text-[rgba(232,228,214,0.65)]"
                                onClick={() => setMobileOpen(false)}
                              >
                                {l.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 font-body text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[rgba(232,228,214,0.35)]">
                        Λαογραφικά
                      </p>
                      <ul className="grid grid-cols-1 gap-0.5">
                        {FOLKLORE.map((l) => (
                          <li key={`${l.href}-${l.label}`}>
                            <Link
                              href={l.href}
                              className="block rounded-sm px-3 py-1.5 font-body text-sm text-[rgba(232,228,214,0.6)]"
                              onClick={() => setMobileOpen(false)}
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`shrink-0 opacity-80 transition-transform duration-200 ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
