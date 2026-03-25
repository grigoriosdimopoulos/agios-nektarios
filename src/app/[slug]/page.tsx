import { SubpageShell } from "@/components/SubpageShell";
import {
  LEGACY_FILES,
  loadLegacyFragment,
} from "@/lib/loadLegacyPage";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const TITLES: Record<string, string> = {
  "readmore-index-center": "Ο οικισμός μας — Συνέχεια",
  Newspaper: "Εφημερίδα",
  Weather: "Καιρός",
  Contact: "Επικοινωνία",
  Documents: "Καταστατικό και Πρακτικά",
  PPKnews: "ΠΠΚ — Νέα",
  "Church-news": "Νέα Ναού",
  "Site-Policy": "Πολιτική ιστότοπου",
  Agios_Nektarios: "Άγιος Νεκτάριος",
  Agios_Fanourios: "Άγιος Φανούριος",
  Agia_Marina: "Αγία Μαρίνα",
  Hercules: "Ηρακλής",
  "The-Furies": "Οι Ερινύες",
  Egosthena_Fortress: "Φρούριο Αιγοσθενών",
  Eleftheres_Castle: "Κάστρο Ελευθερών",
  "Under-Construction": "Σε εξέλιξη",
};

export function generateStaticParams() {
  return Object.keys(LEGACY_FILES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = TITLES[slug] ?? slug;
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
  const file = LEGACY_FILES[slug];
  if (!file) notFound();

  const html = loadLegacyFragment(file);
  return <SubpageShell html={html} />;
}
