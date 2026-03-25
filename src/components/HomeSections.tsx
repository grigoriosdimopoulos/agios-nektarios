"use client";

import Link from "next/link";
import { LEGACY_ORIGIN } from "@/lib/legacyOrigin";
import { motion, useReducedMotion } from "framer-motion";
import { AtmosphericField } from "./AtmosphericField";
import { SectionTransition } from "./SectionTransition";

// ── Tokens ─────────────────────────────────────────────────────────────────────
const lbl = "font-body text-[0.6rem] font-medium uppercase tracking-[0.38em] text-[rgba(154,123,82,0.72)]";
const ttl = "font-display font-medium leading-[1.18] tracking-tight text-[var(--ivory)]";
const bdy = "font-body text-[0.95rem] leading-[1.95] text-[rgba(232,228,214,0.62)] md:text-[1.01rem]";
const panel = "rounded-[2px] border border-[rgba(232,228,214,0.052)] bg-[rgba(10,12,15,0.55)] p-7 md:p-9";

// ── Data ───────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "1970", label: "Ίδρυση" },
  { value: "372.300", label: "Στρέμματα" },
  { value: "650m", label: "Υψόμετρο" },
  { value: "130+", label: "Κατοικίες" },
];

const FOLKLORE = [
  { num: "001", title: "Ο Άγιος Νεκτάριος", sub: "Ο προστάτης του τόπου", href: "/Agios_Nektarios" },
  { num: "002", title: "Ο Άγιος Φανούριος", sub: "Λαϊκή παράδοση", href: "/Agios_Fanourios" },
  { num: "003", title: "Η Αγία Μαρίνα", sub: "Τοπική λατρεία", href: "/Agia_Marina" },
  { num: "004", title: "Ο Όσιος Μελέτιος", sub: "Ιστορία & πίστη", href: "/Under-Construction" },
  { num: "005", title: "Ο Ηρακλής", sub: "Μυθολογία Κιθαιρώνα", href: "/Hercules" },
  { num: "006", title: "Οι Ερινύες", sub: "Αρχαία μυθολογία", href: "/The-Furies" },
  { num: "007", title: "Φρούριο Αιγοσθενών", sub: "Αρχαιολογικό μνημείο", href: "/Egosthena_Fortress" },
  { num: "008", title: "Κάστρο Ελευθερών", sub: "Βυζαντινή ιστορία", href: "/Eleftheres_Castle" },
  { num: "009", title: "Ο Κιθαιρώνας", sub: "Το βουνό μας", href: "/Under-Construction" },
];

const NEWS = [
  { label: "Πνευματικό & Πολιτιστικό Κέντρο", href: "/PPKnews", ext: false },
  { label: "Νέα Τρίκλιτου Ναού", href: "/Church-news", ext: false },
  { label: "Δήμος Μάνδρας-Ειδυλλίας", href: "https://mandras-eidyllias.gr/", ext: true },
];

// ── Stat item with animated number ─────────────────────────────────────────────
function StatItem({ value, label, index }: { value: string; label: string; index: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 28, filter: reduced ? "blur(0)" : "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0)" }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      className={`px-5 ${index > 0 ? "border-l border-[rgba(232,228,214,0.052)]" : ""}`}
    >
      <p className="font-display text-[2.6rem] font-medium leading-none tracking-[-0.04em] text-[var(--ivory)] md:text-[3.2rem]">
        {value}
      </p>
      <p className="mt-2.5 font-body text-[0.58rem] uppercase tracking-[0.3em] text-[rgba(232,228,214,0.32)]">
        {label}
      </p>
    </motion.div>
  );
}

// ── Folklore row with magnetic hover ──────────────────────────────────────────
function FolkloreRow({ item, index }: { item: (typeof FOLKLORE)[0]; index: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, x: reduced ? 0 : -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: index * 0.055 }}
    >
      <Link
        href={item.href}
        className="group relative flex items-center gap-5 overflow-hidden border-b border-[rgba(232,228,214,0.042)] py-[1.1rem] transition-colors duration-500 hover:bg-[rgba(232,228,214,0.018)] md:gap-8 md:py-5"
      >
        {/* Hover accent line */}
        <motion.div
          className="absolute left-0 top-0 h-full w-px bg-[rgba(154,123,82,0.6)]"
          initial={{ scaleY: 0 }}
          whileHover={{ scaleY: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
        <span className="w-8 shrink-0 font-body text-[0.57rem] font-medium tabular-nums text-[rgba(232,228,214,0.2)]">
          {item.num}
        </span>
        <span className={`flex-1 ${ttl} text-[1.02rem] text-[rgba(232,228,214,0.72)] transition-colors duration-400 group-hover:text-[var(--ivory)] md:text-[1.18rem]`}>
          {item.title}
        </span>
        <span className="hidden font-body text-[0.7rem] text-[rgba(232,228,214,0.28)] transition-colors duration-400 group-hover:text-[rgba(232,228,214,0.45)] md:block">
          {item.sub}
        </span>
        <motion.span
          className="ml-auto font-body text-[rgba(154,123,82,0.5)]"
          initial={{ x: -8, opacity: 0 }}
          whileHover={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          →
        </motion.span>
      </Link>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function HomeSections() {
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#0e1013_0%,#0a0c0e_28%,#080a0c_100%)] pb-36">
      <AtmosphericField className="opacity-45" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-[var(--void)] to-transparent" />

      <div className="relative mx-auto max-w-5xl px-5 md:px-10">

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div className="border-b border-[rgba(232,228,214,0.052)] py-16">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s, i) => (
              <StatItem key={s.label} value={s.value} label={s.label} index={i} />
            ))}
          </div>
        </div>

        {/* ── Essence ─────────────────────────────────────────────────── */}
        <SectionTransition className="py-28 text-center md:py-36">
          <p className={`${ttl} mx-auto max-w-xl text-[1.6rem] leading-[1.42] md:text-[2.05rem]`}>
            Ένας τόπος όπου η φύση,
            <br />
            <span className="text-[rgba(232,228,214,0.52)] italic">η μνήμη και η κοινότητα</span>
            <br />
            μιλούν με ησυχία.
          </p>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="mx-auto mt-8 h-px w-12 origin-left bg-[rgba(154,123,82,0.35)]"
          />
        </SectionTransition>

        {/* ── Ο Οικισμός + Χάρτης ─────────────────────────────────────── */}
        <SectionTransition className="pb-24 md:pb-32">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <div>
              <p className={lbl}>Τοποθεσία</p>
              <h2 className={`${ttl} mt-3 text-[1.7rem] md:text-[2rem]`}>Ο Οικισμός Μας</h2>
              <p className={`${bdy} mt-6`}>
                Ο οικισμός βρίσκεται στους πρόποδες του όρους Κιθαιρώνα,
                απέναντι από το όρος Πατέρα, στη θέση &quot;Μαγκούλεζα&quot;
                της κτηματικής περιφέρειας του Δήμου Βιλίων,
                σε υψόμετρο 650–700 μέτρων.
              </p>
              <p className={`${bdy} mt-5`}>
                Ιδρύθηκε το 1970 σε έκταση 372.300 στρεμμάτων. Σήμερα αριθμεί
                πάνω από 130 κατοικίες και αποτελεί έναν ζωντανό οικισμό με
                αστική τηλεφωνία, ασφαλτοστρωμένους δρόμους και έναν
                τρισυπόστατο ναό.
              </p>
              <div className="mt-8">
                <Link
                  href="/readmore-index-center"
                  className="group inline-flex items-center gap-3 font-body text-sm text-[rgba(232,228,214,0.5)] transition-colors duration-400 hover:text-[var(--ivory)]"
                >
                  Διαβάστε περισσότερα
                  <motion.span
                    className="text-[rgba(154,123,82,0.65)]"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    →
                  </motion.span>
                </Link>
              </div>
            </div>

            <motion.div
              className={panel}
              whileInView={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            >
              <div className="overflow-hidden rounded-[2px] border border-[rgba(232,228,214,0.06)]">
                <iframe
                  title="Χάρτης Αγίου Νεκταρίου"
                  width="100%"
                  height="300"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="opacity-88"
                  src="https://maps.google.gr/maps?hl=el&ie=UTF8&t=h&ll=38.162535,23.291316&spn=0.01181,0.018239&z=15&output=embed"
                />
              </div>
              <p className="mt-4">
                <a
                  href="https://maps.google.gr/maps?hl=el&ie=UTF8&t=h&ll=38.162535,23.291316&spn=0.01181,0.018239&z=15&source=embed"
                  className="font-body text-[0.76rem] text-[rgba(232,228,214,0.38)] underline decoration-[rgba(154,123,82,0.22)] underline-offset-4 transition hover:text-[rgba(232,228,214,0.65)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Μεγαλύτερος χάρτης →
                </a>
              </p>
            </motion.div>
          </div>
        </SectionTransition>

        {/* ── Λαογραφία & Ιστορία ─────────────────────────────────────── */}
        <SectionTransition className="pb-24 md:pb-32">
          <div className="mb-8 flex items-end justify-between border-b border-[rgba(232,228,214,0.052)] pb-6">
            <div>
              <p className={lbl}>Λαογραφικά &amp; Ιστορία</p>
              <h2 className={`${ttl} mt-3 text-[1.7rem] md:text-[2rem]`}>Τόπος &amp; Μύθος</h2>
            </div>
            <span className="hidden font-body text-[0.7rem] text-[rgba(232,228,214,0.25)] md:block">
              {FOLKLORE.length} κεφάλαια
            </span>
          </div>
          <div>
            {FOLKLORE.map((item, i) => (
              <FolkloreRow key={item.num} item={item} index={i} />
            ))}
          </div>
        </SectionTransition>

        {/* ── Κοπή Πίτας ──────────────────────────────────────────────── */}
        <SectionTransition className="pb-24 md:pb-32">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-14">
            <div className={panel}>
              <p className={lbl}>Εκδηλώσεις 2026</p>
              <h2 className={`${ttl} mt-3 text-[1.55rem] md:text-[1.8rem]`}>Κοπή Πίτας</h2>
              <p className={`${bdy} mt-5`}>
                Η ετήσια εκδήλωση του Συλλόγου που ενώνει τους οικιστούς και
                κρατά ζωντανή την παράδοση.
              </p>
              <a
                href={`${LEGACY_ORIGIN}/Pita2026.pdf`}
                className="mt-6 inline-flex items-center gap-2 font-body text-sm text-[rgba(154,123,82,0.8)] transition hover:text-[rgba(232,228,214,0.88)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Προσκλητήριο PDF</span>
                <span>↗</span>
              </a>
            </div>
            <motion.div
              className="overflow-hidden rounded-[2px] border border-[rgba(232,228,214,0.045)] shadow-[0_18px_52px_rgba(0,0,0,0.28)]"
              whileHover={{ scale: 1.015 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${LEGACY_ORIGIN}/Pita2026.jpg`}
                alt="Κοπή πίτας 2026"
                width={570}
                height={400}
                className="h-auto w-full opacity-88"
              />
            </motion.div>
          </div>
        </SectionTransition>

        {/* ── Διοίκηση & Έγγραφα ──────────────────────────────────────── */}
        <SectionTransition className="pb-24 md:pb-32">
          <div className="grid gap-8 md:grid-cols-2">
            <div className={panel}>
              <p className={lbl}>Διοίκηση 2024–2026</p>
              <h2 className={`${ttl} mt-3 text-[1.45rem] md:text-[1.65rem]`}>
                Διοικητικό Συμβούλιο
              </h2>
              <ul className={`${bdy} mt-6 space-y-2.5 border-l border-[rgba(154,123,82,0.2)] pl-5`}>
                <li><span className="text-[rgba(232,228,214,0.38)] text-[0.7rem] uppercase tracking-widest">Πρόεδρος</span><br />Μαρία Δεσύπρη</li>
                <li><span className="text-[rgba(232,228,214,0.38)] text-[0.7rem] uppercase tracking-widest">Αντιπρόεδρος</span><br />Γ. Παγώνης - Εβρενέζογλου</li>
                <li><span className="text-[rgba(232,228,214,0.38)] text-[0.7rem] uppercase tracking-widest">Γεν. Γραμματέας</span><br />Περδίκης Χαράλαμπος</li>
                <li><span className="text-[rgba(232,228,214,0.38)] text-[0.7rem] uppercase tracking-widest">Ταμίας</span><br />Παπαμελετίου Αλεξάνδρα</li>
              </ul>
            </div>

            <div className={panel}>
              <p className={lbl}>Έγγραφα</p>
              <h2 className={`${ttl} mt-3 text-[1.45rem] md:text-[1.65rem]`}>Πρακτικά Συλλόγου</h2>
              <p className={`${bdy} mt-5`}>
                Ο Εξωραϊστικός Σύλλογος δημοσιεύει τα πρακτικά των
                συνεδριάσεών του για πλήρη διαφάνεια απέναντι στα μέλη.
              </p>
              <div className="mt-6 space-y-3.5">
                <a
                  href={`${LEGACY_ORIGIN}/23DS_N1.pdf`}
                  className="group flex items-center gap-2 font-body text-[0.86rem] text-[rgba(232,228,214,0.52)] transition hover:text-[var(--ivory)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-[rgba(154,123,82,0.55)]">↗</span>
                  Τελευταίο πρακτικό (23ου ΔΣ)
                </a>
                <Link
                  href="/Documents"
                  className="group flex items-center gap-2 font-body text-[0.86rem] text-[rgba(232,228,214,0.52)] transition hover:text-[var(--ivory)]"
                >
                  <span className="text-[rgba(154,123,82,0.55)]">→</span>
                  Αρχείο πρακτικών
                </Link>
              </div>
            </div>
          </div>
        </SectionTransition>

        {/* ── Νέα & Επικοινωνία ────────────────────────────────────────── */}
        <SectionTransition className="pb-8">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div className={panel}>
              <p className={lbl}>Νέα &amp; Ανακοινώσεις</p>
              <h2 className={`${ttl} mt-3 text-[1.45rem] md:text-[1.65rem]`}>Ειδήσεις</h2>
              <div className="mt-7 divide-y divide-[rgba(232,228,214,0.042)]">
                {NEWS.map((n) =>
                  n.ext ? (
                    <a
                      key={n.href}
                      href={n.href}
                      className="group flex items-center justify-between py-4 font-body text-[0.84rem] text-[rgba(232,228,214,0.55)] transition hover:text-[var(--ivory)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {n.label}
                      <motion.span
                        className="ml-4 text-[rgba(154,123,82,0.45)]"
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.2 }}
                      >
                        ↗
                      </motion.span>
                    </a>
                  ) : (
                    <Link
                      key={n.href}
                      href={n.href}
                      className="group flex items-center justify-between py-4 font-body text-[0.84rem] text-[rgba(232,228,214,0.55)] transition hover:text-[var(--ivory)]"
                    >
                      {n.label}
                      <motion.span
                        className="ml-4 text-[rgba(154,123,82,0.45)]"
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.2 }}
                      >
                        →
                      </motion.span>
                    </Link>
                  ),
                )}
              </div>
            </div>

            <div className={panel}>
              <p className={lbl}>Επικοινωνία</p>
              <h2 className={`${ttl} mt-3 text-[1.45rem] md:text-[1.65rem]`}>Συμμετοχή</h2>
              <p className={`${bdy} mt-5`}>
                Η φωνή κάθε κατοίκου μετράει. Στείλτε μας τα κείμενα, τις
                απόψεις και τις προτάσεις σας.
              </p>
              <a
                href="mailto:agiosnektarios.vilia@gmail.com"
                className="mt-5 block font-body text-[0.84rem] text-[rgba(154,123,82,0.78)] underline decoration-[rgba(154,123,82,0.25)] underline-offset-4 transition hover:text-[rgba(232,228,214,0.9)]"
              >
                agiosnektarios.vilia@gmail.com
              </a>
              <div className="mt-7 flex gap-3">
                <Link
                  href="/Contact"
                  className="inline-flex border border-[rgba(232,228,214,0.09)] px-5 py-2.5 font-body text-[0.66rem] uppercase tracking-[0.22em] text-[rgba(232,228,214,0.55)] transition duration-400 hover:border-[rgba(154,123,82,0.28)] hover:text-[var(--ivory)]"
                >
                  Επικοινωνία
                </Link>
                <Link
                  href="/Site-Policy"
                  className="inline-flex border border-[rgba(232,228,214,0.06)] px-5 py-2.5 font-body text-[0.66rem] uppercase tracking-[0.22em] text-[rgba(232,228,214,0.38)] transition duration-400 hover:text-[rgba(232,228,214,0.6)]"
                >
                  Πολιτική
                </Link>
              </div>
            </div>
          </div>
        </SectionTransition>
      </div>
    </div>
  );
}
