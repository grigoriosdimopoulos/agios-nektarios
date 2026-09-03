"use client";

import { duration, ease } from "@/design/motion";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { HomeContent } from "@/lib/content/schema";
import { AtmosphericField } from "./AtmosphericField";
import { DepthLayer } from "./DepthLayer";
import { ParticleField } from "./ParticleField";

import type { HolidayBadge } from "@/lib/holidayLabel";

type Props = {
  hero: HomeContent["hero"];
  sceneEnabled: boolean;
  holiday: HolidayBadge | null;
};

export function ImmersiveLanding({ hero, sceneEnabled, holiday }: Props) {
  const [ready, setReady] = useState(false);
  const words = [hero.titleTop, hero.titleBottom];
  const ticker = `${hero.ticker}${hero.ticker}`;

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section
      data-hero-section
      className={`relative min-h-[100dvh] overflow-hidden ${sceneEnabled ? "bg-transparent" : "bg-[#070809]"}`}
      aria-label="Εισαγωγική ενότητα"
    >
      {!sceneEnabled && <AtmosphericField variant="hero" />}

      {/* Canvas particles — dust rising */}
      {!sceneEnabled && <ParticleField count={40} className="z-[2]" />}

      {/* Reading scrim so the title holds up over a bright midday sky */}
      {sceneEnabled && (
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(85%_65%_at_20%_40%,rgba(6,8,11,0.5)_0%,rgba(6,8,11,0.2)_45%,transparent_78%)]"
          aria-hidden
        />
      )}

      {/* Cursor spotlight — pure CSS, zero React re-renders */}
      <div
        className="pointer-events-none absolute inset-0 z-[3] cursor-spotlight"
        aria-hidden
      />

      {/* Terrain silhouettes — the living scene draws its own ridge line */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[50vh] ${sceneEnabled ? "hidden" : ""}`}
      >
        <DepthLayer factor={0.22} className="absolute inset-0">
          <svg viewBox="0 0 1440 280" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
            <path
              fill="rgba(9,12,15,0.82)"
              d="M0,196L80,183C160,170,320,144,480,148C640,152,800,188,960,182C1120,176,1280,138,1360,120L1440,102L1440,280L0,280Z"
            />
          </svg>
        </DepthLayer>
        <DepthLayer factor={0.55} className="absolute inset-0">
          <svg viewBox="0 0 1440 280" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
            <path
              fill="rgba(11,14,18,0.93)"
              d="M0,248L80,238C160,228,320,208,480,202C640,196,800,210,960,203C1120,196,1280,168,1360,155L1440,142L1440,280L0,280Z"
            />
          </svg>
        </DepthLayer>
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0e1013] to-transparent" />
      </div>

      {/* Metadata strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.2, ease: ease.outSoft }}
        className="relative z-[4] flex items-center justify-between px-6 pt-28 text-[0.58rem] font-medium uppercase tracking-[0.38em] text-[rgba(232,228,214,0.22)] md:px-12 md:pt-32"
      >
        <span>{hero.metaLeft}</span>
        <span className="hidden md:inline">{hero.metaCenter}</span>
        <span>{hero.metaRight}</span>
      </motion.div>

      {/* Feast day — marked in the page, never painted into the photograph */}
      {holiday && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: duration.md, ease: ease.outSoft, delay: 0.45 }}
          className="relative z-[4] mt-8 flex items-center gap-4 px-5 md:mt-10 md:px-12"
        >
          <span
            className="h-[2px] w-14 shrink-0 rounded-full"
            style={{ backgroundImage: holiday.accent }}
          />
          <span className="font-body text-[0.62rem] uppercase tracking-[0.34em] text-[rgba(232,228,214,0.62)]">
            {holiday.label}
          </span>
        </motion.div>
      )}

      {/* Title — curtain/masking reveal (premium word-by-word) */}
      <div className="relative z-[4] px-5 pt-10 md:px-12 md:pt-14">
        <h1 className="font-display select-none text-[clamp(3.6rem,12.5vw,10rem)] font-medium leading-[0.96] tracking-[-0.055em]">
          <AnimatePresence>
            {words.map((word, i) => (
              <div key={`${word}-${i}`} className="overflow-hidden">
                <motion.span
                  className={`block ${i === 1 ? "text-[rgba(232,228,214,0.58)]" : "text-[var(--ivory)]"}`}
                  initial={{ y: "110%", opacity: 0, filter: "blur(8px)" }}
                  animate={ready ? { y: 0, opacity: 1, filter: "blur(0px)" } : {}}
                  transition={{
                    duration: 1.45,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.08 + i * 0.16,
                  }}
                >
                  {word}
                </motion.span>
              </div>
            ))}
          </AnimatePresence>
        </h1>

        <motion.div
          initial={{ opacity: 0, x: -16, filter: "blur(8px)" }}
          animate={ready ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: duration.md, ease: ease.outSoft, delay: 0.65 }}
          className="mt-10 flex items-start gap-5 md:mt-12"
        >
          <div className="mt-[0.65rem] h-px w-10 shrink-0 bg-gradient-to-r from-[rgba(154,123,82,0.65)] to-transparent" />
          <p className="max-w-[42ch] font-body text-[0.92rem] leading-[1.9] text-[rgba(232,228,214,0.44)] md:text-[0.98rem]">
            {hero.intro}
          </p>
        </motion.div>
      </div>

      {/* Scrolling ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: duration.md, delay: 1.0 }}
        className="relative z-[4] mt-20 overflow-hidden border-t border-[rgba(232,228,214,0.048)] py-3.5"
      >
        <p className="marquee-track whitespace-nowrap font-body text-[0.58rem] uppercase tracking-[0.32em] text-[rgba(232,228,214,0.17)]" aria-hidden>
          {ticker}
        </p>
      </motion.div>

      {/* Right-side vertical scroll cue */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.5, duration: duration.md }}
        className="pointer-events-none absolute bottom-10 right-8 z-[5] flex flex-col items-end gap-2 md:bottom-14 md:right-12"
      >
        <span className="font-body text-[0.57rem] uppercase tracking-[0.32em] text-[rgba(232,228,214,0.2)]">
          Scroll
        </span>
        <motion.span
          animate={{ scaleY: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
          className="block h-16 w-px origin-top bg-gradient-to-b from-[rgba(154,123,82,0.5)] to-transparent"
        />
      </motion.div>
    </section>
  );
}
