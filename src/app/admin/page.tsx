import Link from "next/link";

import {
  PAGE_TITLES,
  listEditedPageSlugs,
  listMedia,
  listPageSlugs,
} from "@/lib/content";
import { getSession } from "@/lib/session";
import { Panel } from "./ui";

export const dynamic = "force-dynamic";

const CARDS = [
  {
    href: "/admin/home",
    title: "Αρχική σελίδα",
    text: "Τίτλοι, εισαγωγή, στατιστικά, ενότητες, ΔΣ και επικοινωνία.",
  },
  {
    href: "/admin/pages",
    title: "Σελίδες",
    text: "Κείμενο και εικόνες για κάθε εσωτερική σελίδα του ιστότοπου.",
  },
  {
    href: "/admin/media",
    title: "Αρχεία",
    text: "Ανεβάστε φωτογραφίες και PDF και αντιγράψτε τον σύνδεσμό τους.",
  },
  {
    href: "/admin/scene",
    title: "Σκηνικό & ρυθμίσεις",
    text: "Ζωντανό φόντο: μέρα/νύχτα, καιρός, εποχές, γιορτές.",
  },
];

export default async function AdminHome() {
  const [session, edited, media] = await Promise.all([
    getSession(),
    listEditedPageSlugs(),
    listMedia(),
  ]);
  const slugs = listPageSlugs();

  return (
    <>
      <div>
        <h1 className="font-display text-[2rem] font-medium text-[var(--ivory)]">
          Καλώς ήρθατε{session ? `, ${session.sub}` : ""}
        </h1>
        <p className="mt-2 font-body text-[0.88rem] text-[rgba(232,228,214,0.45)]">
          Κάθε αλλαγή δημοσιεύεται αμέσως στον ιστότοπο.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-[3px] border border-[rgba(232,228,214,0.07)] bg-[rgba(12,14,18,0.72)] p-6 transition hover:border-[rgba(154,123,82,0.35)]"
          >
            <h2 className="font-display text-[1.2rem] font-medium text-[var(--ivory)]">
              {card.title}
            </h2>
            <p className="mt-2 font-body text-[0.84rem] leading-relaxed text-[rgba(232,228,214,0.45)]">
              {card.text}
            </p>
            <span className="mt-4 inline-block font-body text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(154,123,82,0.75)]">
              Άνοιγμα →
            </span>
          </Link>
        ))}
      </div>

      <Panel title="Κατάσταση">
        <dl className="grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="font-body text-[0.6rem] uppercase tracking-[0.28em] text-[rgba(232,228,214,0.35)]">
              Σελίδες
            </dt>
            <dd className="mt-2 font-display text-[1.8rem] text-[var(--ivory)]">
              {slugs.length}
            </dd>
          </div>
          <div>
            <dt className="font-body text-[0.6rem] uppercase tracking-[0.28em] text-[rgba(232,228,214,0.35)]">
              Επεξεργασμένες
            </dt>
            <dd className="mt-2 font-display text-[1.8rem] text-[var(--ivory)]">
              {edited.size}
            </dd>
          </div>
          <div>
            <dt className="font-body text-[0.6rem] uppercase tracking-[0.28em] text-[rgba(232,228,214,0.35)]">
              Αρχεία
            </dt>
            <dd className="mt-2 font-display text-[1.8rem] text-[var(--ivory)]">
              {media.length}
            </dd>
          </div>
        </dl>
        {edited.size > 0 && (
          <p className="mt-6 font-body text-[0.82rem] text-[rgba(232,228,214,0.45)]">
            Τροποποιημένες σελίδες:{" "}
            {[...edited]
              .map((slug) => PAGE_TITLES[slug] ?? slug)
              .join(", ")}
          </p>
        )}
      </Panel>
    </>
  );
}
