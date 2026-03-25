import type { NextConfig } from "next";

const legacyHtml = [
  "index.html",
  "readmore-index-center.html",
  "Newspaper.html",
  "Weather.html",
  "Contact.html",
  "Documents.html",
  "PPKnews.html",
  "Church news.html",
  "Site-Policy.html",
  "Agios_Nektarios.html",
  "Agios_Fanourios.html",
  "Agia_Marina.html",
  "Hercules.html",
  "The-Furies.html",
  "Egosthena_Fortress.html",
  "Eleftheres_Castle.html",
  "Under-Construction.html",
];

const slugMap: Record<string, string> = {
  "index.html": "/",
  "readmore-index-center.html": "/readmore-index-center",
  "Newspaper.html": "/Newspaper",
  "Weather.html": "/Weather",
  "Contact.html": "/Contact",
  "Documents.html": "/Documents",
  "PPKnews.html": "/PPKnews",
  "Church news.html": "/Church-news",
  "Site-Policy.html": "/Site-Policy",
  "Agios_Nektarios.html": "/Agios_Nektarios",
  "Agios_Fanourios.html": "/Agios_Fanourios",
  "Agia_Marina.html": "/Agia_Marina",
  "Hercules.html": "/Hercules",
  "The-Furies.html": "/The-Furies",
  "Egosthena_Fortress.html": "/Egosthena_Fortress",
  "Eleftheres_Castle.html": "/Eleftheres_Castle",
  "Under-Construction.html": "/Under-Construction",
};

const nextConfig: NextConfig = {
  async redirects() {
    return legacyHtml.map((file) => ({
      source: `/${file}`,
      destination: slugMap[file] ?? "/",
      permanent: true,
    }));
  },
};

export default nextConfig;
