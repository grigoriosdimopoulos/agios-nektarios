"use client";

import Link from "next/link";
import type { BoardMember, HomeContent, LinkItem, StatItem } from "@/lib/content/schema";
import { motion, useReducedMotion } from "framer-motion";
import { AtmosphericField } from "./AtmosphericField";
import { SectionTransition } from "./SectionTransition";

// ── Tokens ─────────────────────────────────────────────────────────────────────
const lbl = "font-body text-[0.6rem] font-medium uppercase tracking-[0.38em] text-[rgba(154,123,82,0.72)]";
const ttl = "font-display font-medium leading-[1.18] tracking-tight text-[var(--ivory)]";
const bdy = "font-body text-[0.95rem] leading-[1.95] text-[rgba(232,228,214,0.62)] md:text-[1.01rem]";
const panel = "rounded-[2px] border border-[rgba(232,228,214,0.052)] bg-[rgba(10,12,15,0.55)] p-7 md:p-9";

function isExternal(item: LinkItem): boolean {
  return item.external ?? /^https?:/i.test(item.href);
}

// ── Stat item with animated number ─────────────────────────────────────────────
function StatItem({ value, label, index }: StatItem & { index: number }) {
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
function FolkloreRow({ item, index }: { item: LinkItem; index: number }) {
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

function BoardRow({ member }: { member: BoardMember }) {
  return (
    <li>
      <span className="text-[rgba(232,228,214,0.38)] text-[0.7rem] uppercase tracking-widest">
        {member.role}
      </span>
      <br />
      {member.name}
    </li>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function HomeSections({ content }: { content: HomeContent }) {
  const { stats, essence, settlement, folklore, event, board, documents, news, contact } =
    content;

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(14,16,19,0.92)_0%,rgba(10,12,14,0.94)_28%,rgba(8,10,12,0.96)_100%)] pb-36">
      <AtmosphericField className="opacity-45" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-[var(--void)] to-transparent" />

      <div className="relative mx-auto max-w-5xl px-5 md:px-10">

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div className="border-b border-[rgba(232,228,214,0.052)] py-16">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <StatItem key={`${s.label}-${i}`} value={s.value} label={s.label} index={i} />
            ))}
          </div>
        </div>

        {/* ── Essence ─────────────────────────────────────────────────── */}
        <SectionTransition className="py-28 text-center md:py-36">
          <p className={`${ttl} mx-auto max-w-xl text-[1.6rem] leading-[1.42] md:text-[2.05rem]`}>
            {essence.lineOne}
            <br />
            <span className="text-[rgba(232,228,214,0.52)] italic">{essence.lineTwo}</span>
            <br />
            {essence.lineThree}
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
              <p className={lbl}>{settlement.label}</p>
              <h2 className={`${ttl} mt-3 text-[1.7rem] md:text-[2rem]`}>{settlement.title}</h2>
              {settlement.paragraphs.map((paragraph, i) => (
                <p key={i} className={`${bdy} ${i === 0 ? "mt-6" : "mt-5"}`}>
                  {paragraph}
                </p>
              ))}
              {settlement.moreHref && (
                <div className="mt-8">
                  <Link
                    href={settlement.moreHref}
                    className="group inline-flex items-center gap-3 font-body text-sm text-[rgba(232,228,214,0.5)] transition-colors duration-400 hover:text-[var(--ivory)]"
                  >
                    {settlement.moreLabel}
                    <motion.span
                      className="text-[rgba(154,123,82,0.65)]"
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                    >
                      →
                    </motion.span>
                  </Link>
                </div>
              )}
            </div>

            {settlement.mapEmbedUrl && (
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
                    src={settlement.mapEmbedUrl}
                  />
                </div>
                {settlement.mapLinkUrl && (
                  <p className="mt-4">
                    <a
                      href={settlement.mapLinkUrl}
                      className="font-body text-[0.76rem] text-[rgba(232,228,214,0.38)] underline decoration-[rgba(154,123,82,0.22)] underline-offset-4 transition hover:text-[rgba(232,228,214,0.65)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Μεγαλύτερος χάρτης →
                    </a>
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </SectionTransition>

        {/* ── Λαογραφία & Ιστορία ─────────────────────────────────────── */}
        <SectionTransition className="pb-24 md:pb-32">
          <div className="mb-8 flex items-end justify-between border-b border-[rgba(232,228,214,0.052)] pb-6">
            <div>
              <p className={lbl}>{folklore.label}</p>
              <h2 className={`${ttl} mt-3 text-[1.7rem] md:text-[2rem]`}>{folklore.title}</h2>
            </div>
            <span className="hidden font-body text-[0.7rem] text-[rgba(232,228,214,0.25)] md:block">
              {folklore.items.length} κεφάλαια
            </span>
          </div>
          <div>
            {folklore.items.map((item, i) => (
              <FolkloreRow key={`${item.href}-${i}`} item={item} index={i} />
            ))}
          </div>
        </SectionTransition>

        {/* ── Εκδήλωση ────────────────────────────────────────────────── */}
        <SectionTransition className="pb-24 md:pb-32">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-14">
            <div className={panel}>
              <p className={lbl}>{event.label}</p>
              <h2 className={`${ttl} mt-3 text-[1.55rem] md:text-[1.8rem]`}>{event.title}</h2>
              <p className={`${bdy} mt-5`}>{event.text}</p>
              {event.linkHref &&
                (/^https?:/i.test(event.linkHref) ? (
                  <a
                    href={event.linkHref}
                    className="mt-6 inline-flex items-center gap-2 font-body text-sm text-[rgba(154,123,82,0.8)] transition hover:text-[rgba(232,228,214,0.88)]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{event.linkLabel}</span>
                    <span>↗</span>
                  </a>
                ) : (
                  <Link
                    href={event.linkHref}
                    className="mt-6 inline-flex items-center gap-2 font-body text-sm text-[rgba(154,123,82,0.8)] transition hover:text-[rgba(232,228,214,0.88)]"
                  >
                    <span>{event.linkLabel}</span>
                    <span>→</span>
                  </Link>
                ))}
            </div>
            {event.imageUrl && (
              <motion.div
                className="overflow-hidden rounded-[2px] border border-[rgba(232,228,214,0.045)] shadow-[0_18px_52px_rgba(0,0,0,0.28)]"
                whileHover={{ scale: 1.015 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="h-auto w-full opacity-88"
                />
              </motion.div>
            )}
          </div>
        </SectionTransition>

        {/* ── Διοίκηση & Έγγραφα ──────────────────────────────────────── */}
        <SectionTransition className="pb-24 md:pb-32">
          <div className="grid gap-8 md:grid-cols-2">
            <div className={panel}>
              <p className={lbl}>{board.label}</p>
              <h2 className={`${ttl} mt-3 text-[1.45rem] md:text-[1.65rem]`}>{board.title}</h2>
              <ul className={`${bdy} mt-6 space-y-2.5 border-l border-[rgba(154,123,82,0.2)] pl-5`}>
                {board.members.map((member, i) => (
                  <BoardRow key={`${member.role}-${i}`} member={member} />
                ))}
              </ul>
            </div>

            <div className={panel}>
              <p className={lbl}>{documents.label}</p>
              <h2 className={`${ttl} mt-3 text-[1.45rem] md:text-[1.65rem]`}>{documents.title}</h2>
              <p className={`${bdy} mt-5`}>{documents.text}</p>
              <div className="mt-6 space-y-3.5">
                {documents.links.map((link, i) =>
                  isExternal(link) ? (
                    <a
                      key={`${link.href}-${i}`}
                      href={link.href}
                      className="group flex items-center gap-2 font-body text-[0.86rem] text-[rgba(232,228,214,0.52)] transition hover:text-[var(--ivory)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="text-[rgba(154,123,82,0.55)]">↗</span>
                      {link.title}
                    </a>
                  ) : (
                    <Link
                      key={`${link.href}-${i}`}
                      href={link.href}
                      className="group flex items-center gap-2 font-body text-[0.86rem] text-[rgba(232,228,214,0.52)] transition hover:text-[var(--ivory)]"
                    >
                      <span className="text-[rgba(154,123,82,0.55)]">→</span>
                      {link.title}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>
        </SectionTransition>

        {/* ── Νέα & Επικοινωνία ────────────────────────────────────────── */}
        <SectionTransition className="pb-8">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div className={panel}>
              <p className={lbl}>{news.label}</p>
              <h2 className={`${ttl} mt-3 text-[1.45rem] md:text-[1.65rem]`}>{news.title}</h2>
              <div className="mt-7 divide-y divide-[rgba(232,228,214,0.042)]">
                {news.items.map((item, i) =>
                  isExternal(item) ? (
                    <a
                      key={`${item.href}-${i}`}
                      href={item.href}
                      className="group flex items-center justify-between py-4 font-body text-[0.84rem] text-[rgba(232,228,214,0.55)] transition hover:text-[var(--ivory)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title}
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
                      key={`${item.href}-${i}`}
                      href={item.href}
                      className="group flex items-center justify-between py-4 font-body text-[0.84rem] text-[rgba(232,228,214,0.55)] transition hover:text-[var(--ivory)]"
                    >
                      {item.title}
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
              <p className={lbl}>{contact.label}</p>
              <h2 className={`${ttl} mt-3 text-[1.45rem] md:text-[1.65rem]`}>{contact.title}</h2>
              <p className={`${bdy} mt-5`}>{contact.text}</p>
              <a
                href={`mailto:${contact.email}`}
                className="mt-5 block font-body text-[0.84rem] text-[rgba(154,123,82,0.78)] underline decoration-[rgba(154,123,82,0.25)] underline-offset-4 transition hover:text-[rgba(232,228,214,0.9)]"
              >
                {contact.email}
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
