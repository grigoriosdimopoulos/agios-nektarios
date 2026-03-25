import { LEGACY_ORIGIN } from "./legacyOrigin";

/**
 * Maps original filenames to Next.js routes (no trailing slash).
 * Keys are lowercased for lookup.
 */
const INTERNAL_ROUTES: Record<string, string> = {
  "index.html": "/",
  "readmore-index-center.html": "/readmore-index-center",
  "newspaper.html": "/Newspaper",
  "weather.html": "/Weather",
  "contact.html": "/Contact",
  "documents.html": "/Documents",
  "ppknews.html": "/PPKnews",
  "church news.html": "/Church-news",
  "church-news.html": "/Church-news",
  "site-policy.html": "/Site-Policy",
  "agios_nektarios.html": "/Agios_Nektarios",
  "agios_fanourios.html": "/Agios_Fanourios",
  "agia_marina.html": "/Agia_Marina",
  "hercules.html": "/Hercules",
  "the-furies.html": "/The-Furies",
  "egosthena_fortress.html": "/Egosthena_Fortress",
  "eleftheres_castle.html": "/Eleftheres_Castle",
  "under-construction.html": "/Under-Construction",
};

function rewriteHref(href: string): string {
  const raw = href.trim();
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("#") ||
    raw.startsWith("javascript:")
  ) {
    return raw;
  }

  const pathPart = raw.split(/[?#]/)[0] ?? raw;
  const base = pathPart.split("/").pop() ?? pathPart;
  const key = decodeURIComponent(base).toLowerCase();
  const mapped = INTERNAL_ROUTES[key];
  if (mapped) return mapped;

  // PDF, DOC, images, or unmigrated HTML → stay on legacy host
  if (!pathPart.includes("/")) {
    return `${LEGACY_ORIGIN}/${encodeURI(decodeURIComponent(pathPart))}`;
  }
  return `${LEGACY_ORIGIN}/${pathPart}`;
}

/**
 * Rewrites relative links in legacy HTML fragments so they work from the new site.
 */
export function rewriteLegacyHtml(html: string): string {
  return html.replace(
    /\b(href|src)=(["'])([^"']+)\2/gi,
    (match, attr: string, quote: string, url: string) => {
      const lower = attr.toLowerCase();
      if (lower === "src") {
        const u = url.trim();
        if (
          u.startsWith("http://") ||
          u.startsWith("https://") ||
          u.startsWith("data:") ||
          u.startsWith("//")
        ) {
          return match;
        }
        const clean = u.replace(/^\//, "");
        return `${attr}=${quote}${LEGACY_ORIGIN}/${clean}${quote}`;
      }
      if (lower === "href") {
        return `${attr}=${quote}${rewriteHref(url)}${quote}`;
      }
      return match;
    },
  );
}

export function extractMainFragment(fullHtml: string): string {
  const start = fullHtml.search(/<div[^>]*id=["']main["']/i);
  if (start === -1) {
    return rewriteLegacyHtml(fullHtml);
  }
  const footerIdx = fullHtml.indexOf("<!--footer begins -->", start);
  const end = footerIdx === -1 ? fullHtml.length : footerIdx;
  const fragment = fullHtml.slice(start, end);
  return rewriteLegacyHtml(fragment);
}
