import { HomePageClient } from "@/components/HomePageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Αρχική",
  description:
    "Εξωραϊστικός Σύλλογος «Αγιος Νεκτάριος Βιλίων». Ο οικισμός στους πρόποδες του Κιθαιρώνα.",
};

export default function Home() {
  return <HomePageClient />;
}
