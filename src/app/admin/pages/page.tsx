import Link from "next/link";

import { PAGE_TITLES, listEditedPageSlugs, listPageSlugs } from "@/lib/content";
import { Panel } from "../ui";

export const dynamic = "force-dynamic";

export default async function AdminPagesList() {
  const slugs = listPageSlugs();
  const edited = await listEditedPageSlugs();

  return (
    <Panel
      title="Σελίδες"
      description="Επιλέξτε σελίδα για να αλλάξετε τον τίτλο και το κείμενό της."
    >
      <ul className="divide-y divide-[rgba(232,228,214,0.06)]">
        {slugs.map((slug) => (
          <li key={slug}>
            <Link
              href={`/admin/pages/${slug}`}
              className="group flex items-center justify-between gap-4 py-4 transition hover:bg-[rgba(232,228,214,0.02)]"
            >
              <span>
                <span className="block font-body text-[0.98rem] text-[rgba(232,228,214,0.82)] group-hover:text-[var(--ivory)]">
                  {PAGE_TITLES[slug] ?? slug}
                </span>
                <span className="mt-1 block font-body text-[0.72rem] text-[rgba(232,228,214,0.3)]">
                  /{slug}
                </span>
              </span>
              <span className="flex items-center gap-4">
                {edited.has(slug) && (
                  <span className="rounded-full border border-[rgba(154,123,82,0.4)] px-3 py-1 font-body text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(154,123,82,0.85)]">
                    Επεξεργασμένη
                  </span>
                )}
                <span className="text-[rgba(154,123,82,0.6)]">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
