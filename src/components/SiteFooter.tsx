import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(232,228,214,0.048)] bg-gradient-to-b from-[#090b0d] to-[var(--void)] px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-start gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-[1.6rem] font-medium tracking-tight text-[rgba(232,228,214,0.82)] md:text-[2rem]">
              Άγιος Νεκτάριος
            </p>
            <p className="mt-2 font-body text-sm text-[rgba(232,228,214,0.32)]">
              Εξωραϊστικός Σύλλογος Βιλίων · Κιθαιρώνας · Δυτική Αττική
            </p>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <a
              href="mailto:agiosnektarios.vilia@gmail.com"
              className="font-body text-[0.82rem] text-[rgba(232,228,214,0.4)] transition hover:text-[rgba(232,228,214,0.72)]"
            >
              agiosnektarios.vilia@gmail.com
            </a>
            <p className="font-body text-[0.7rem] text-[rgba(232,228,214,0.22)]">
              Βίλια 19012
            </p>
          </div>
        </div>

        <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-[rgba(154,123,82,0.22)] to-transparent" />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="font-body text-[0.72rem] text-[rgba(232,228,214,0.28)]">
            © 2009–{new Date().getFullYear()} Εξωραϊστικός Σύλλογος Βιλίων
          </p>
          <div className="flex gap-4">
            <Link
              href="/Site-Policy"
              className="font-body text-[0.72rem] text-[rgba(232,228,214,0.28)] transition hover:text-[rgba(232,228,214,0.55)]"
            >
              Πολιτική ιστότοπου
            </Link>
            <a
              href="http://validator.w3.org/check/referer"
              className="font-body text-[0.72rem] text-[rgba(232,228,214,0.18)] transition hover:text-[rgba(232,228,214,0.4)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              XHTML
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
