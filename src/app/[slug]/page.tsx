import { SubpageShell } from "@/components/SubpageShell";
import { PAGE_TITLES, getPageContent, getSiteSettings } from "@/lib/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageContent(slug);
  const title = page?.title ?? PAGE_TITLES[slug] ?? slug;
  return {
    title: `${title} | ΑΓΙΟΣ ΝΕΚΤΑΡΙΟΣ`,
    description:
      "Εξωραϊστικός Σύλλογος Αγίου Νεκταρίου Βιλίων — Κιθαιρώνας, Δυτική Αττική.",
  };
}

export default async function LegacyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([
    getPageContent(slug),
    getSiteSettings(),
  ]);
  if (!page) notFound();

  return <SubpageShell html={page.html} settings={settings} />;
}
