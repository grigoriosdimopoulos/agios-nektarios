import { HomePageClient } from "@/components/HomePageClient";
import { getHomeContent, getSiteSettings } from "@/lib/content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Αρχική",
  description:
    "Εξωραϊστικός Σύλλογος «Αγιος Νεκτάριος Βιλίων». Ο οικισμός στους πρόποδες του Κιθαιρώνα.",
};

export default async function Home() {
  const [content, settings] = await Promise.all([
    getHomeContent(),
    getSiteSettings(),
  ]);
  return <HomePageClient content={content} settings={settings} />;
}
