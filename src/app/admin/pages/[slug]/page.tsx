import Link from "next/link";
import { notFound } from "next/navigation";

import { getPageContent, listMedia } from "@/lib/content";
import { Panel } from "../../ui";
import { PageEditorForm } from "./PageEditorForm";

export const dynamic = "force-dynamic";

export default async function AdminPageEditor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [page, media] = await Promise.all([getPageContent(slug), listMedia()]);
  if (!page) notFound();

  return (
    <Panel
      title={page.title}
      description={
        page.updatedAt
          ? `Τελευταία αλλαγή: ${new Date(page.updatedAt).toLocaleString("el-GR")} — ${page.updatedBy}`
          : "Δεν έχει τροποποιηθεί ακόμη· εμφανίζεται το αρχικό κείμενο."
      }
      actions={
        <div className="flex gap-4">
          <Link
            href={`/${slug}`}
            target="_blank"
            className="font-body text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(232,228,214,0.45)] transition hover:text-[var(--ivory)]"
          >
            Προβολή ↗
          </Link>
          <Link
            href="/admin/pages"
            className="font-body text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(232,228,214,0.45)] transition hover:text-[var(--ivory)]"
          >
            ← Σελίδες
          </Link>
        </div>
      }
    >
      <PageEditorForm page={page} media={media} />
    </Panel>
  );
}
