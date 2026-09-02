/**
 * Defence-in-depth cleanup for admin-authored HTML.
 *
 * Only an authenticated administrator can reach the editor, but the output is
 * injected with dangerouslySetInnerHTML, so scripts, event handlers and
 * javascript: URLs are stripped before anything is stored.
 */
const BLOCKED_ELEMENTS = /<\s*(script|style|iframe|object|embed|link|meta|base|form)\b[\s\S]*?(?:<\/\s*\1\s*>|>)/gi;
const SELF_CLOSING_BLOCKED = /<\s*(script|style|link|meta|base)\b[^>]*\/?>/gi;
const EVENT_ATTRIBUTES = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URLS =
  /\s(href|src|xlink:href)\s*=\s*(?:"\s*(?:javascript|data(?!:image\/)|vbscript):[^"]*"|'\s*(?:javascript|data(?!:image\/)|vbscript):[^']*'|(?:javascript|vbscript):[^\s>]+)/gi;

/** Allows the Google Maps iframe the site already embeds, nothing else. */
const ALLOWED_IFRAME_HOSTS = [
  "maps.google.gr",
  "maps.google.com",
  "www.google.com",
  "www.youtube.com",
  "youtube.com",
  "player.vimeo.com",
];

function keepAllowedIframes(html: string): {
  html: string;
  restore: (value: string) => string;
} {
  const kept: string[] = [];
  const replaced = html.replace(
    /<iframe\b[^>]*>[\s\S]*?<\/iframe>|<iframe\b[^>]*\/?>/gi,
    (match) => {
      const src = /src\s*=\s*["']([^"']+)["']/i.exec(match)?.[1] ?? "";
      try {
        const host = new URL(src, "https://example.invalid").hostname;
        if (!ALLOWED_IFRAME_HOSTS.includes(host)) return "";
      } catch {
        return "";
      }
      kept.push(match.replace(EVENT_ATTRIBUTES, ""));
      return `__IFRAME_${kept.length - 1}__`;
    },
  );
  return {
    html: replaced,
    restore: (value) =>
      value.replace(/__IFRAME_(\d+)__/g, (_, i: string) => kept[Number(i)] ?? ""),
  };
}

export function sanitizeHtml(input: string): string {
  const { html, restore } = keepAllowedIframes(input);
  const cleaned = html
    .replace(BLOCKED_ELEMENTS, "")
    .replace(SELF_CLOSING_BLOCKED, "")
    .replace(EVENT_ATTRIBUTES, "")
    .replace(DANGEROUS_URLS, "");
  return restore(cleaned);
}

/** Plain-text fields (titles, labels) never contain markup. */
export function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}
