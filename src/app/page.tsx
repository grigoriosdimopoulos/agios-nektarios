import { HomePageClient } from "@/components/HomePageClient";
import { getHomeContent, getSiteSettings } from "@/lib/content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Αρχική",
  description:
    "Ο οικισμός Άγιος Νεκτάριος στους πρόποδες του Κιθαιρώνα, στα 650 μέτρα. Εξωραϊστικός Σύλλογος «Άγιος Νεκτάριος» Μαγκούλεζας Δήμου Βιλίων.",
};

export default async function Home() {
  const [content, settings] = await Promise.all([
    getHomeContent(),
    getSiteSettings(),
  ]);
  return <HomePageClient content={content} settings={settings} />;
}
