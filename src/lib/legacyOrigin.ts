/**
 * Base URL for the files still hosted on the original site — the newspaper
 * archive, the minutes, the phone lists. That host serves plain HTTP only, so
 * these must stay <a href> navigations; never use it for a subresource, or the
 * browser will block it as mixed content.
 */
export const LEGACY_ORIGIN =
  process.env.NEXT_PUBLIC_LEGACY_ORIGIN ?? "http://www.agiosnektarios.gr";
