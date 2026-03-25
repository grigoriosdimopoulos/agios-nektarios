import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { CursorProvider } from "@/components/CursorProvider";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Άγιος Νεκτάριος — Εξωραϊστικός Σύλλογος Βιλίων",
    template: "%s | Άγιος Νεκτάριος",
  },
  description:
    "Ο οικισμός Άγιος Νεκτάριος στους πρόποδες του Κιθαιρώνα. Εξωραϊστικός Σύλλογος Βιλίων.",
  keywords: ["Κιθαιρώνας", "Άγιος Νεκτάριος", "Βίλια", "Εξωραϊστικός Σύλλογος"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="el"
      className={`${display.variable} ${body.variable} h-full scroll-smooth antialiased`}
    >
      <body className="font-body min-h-full bg-[var(--void)] text-[rgba(232,228,214,0.78)]">
        <CursorProvider />
        {children}
      </body>
    </html>
  );
}
