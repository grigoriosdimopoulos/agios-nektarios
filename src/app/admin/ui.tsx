import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-[2px] border border-[rgba(232,228,214,0.12)] bg-[rgba(7,8,9,0.6)] px-3.5 py-2.5 font-body text-[0.9rem] text-[var(--ivory)] outline-none transition focus:border-[rgba(154,123,82,0.55)]";

export const labelClass =
  "block font-body text-[0.6rem] font-medium uppercase tracking-[0.28em] text-[rgba(232,228,214,0.42)]";

export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-[2px] border border-[rgba(154,123,82,0.45)] bg-[rgba(154,123,82,0.14)] px-5 py-2.5 font-body text-[0.68rem] uppercase tracking-[0.22em] text-[var(--ivory)] transition hover:bg-[rgba(154,123,82,0.24)] disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[2px] border border-[rgba(232,228,214,0.12)] px-4 py-2.5 font-body text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(232,228,214,0.6)] transition hover:border-[rgba(232,228,214,0.28)] hover:text-[var(--ivory)] disabled:opacity-50";

export function Panel({
  title,
  description,
  children,
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-[3px] border border-[rgba(232,228,214,0.07)] bg-[rgba(12,14,18,0.72)] p-6 md:p-8">
      {(title || actions) && (
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="font-display text-[1.3rem] font-medium text-[var(--ivory)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1.5 max-w-2xl font-body text-[0.82rem] leading-relaxed text-[rgba(232,228,214,0.45)]">
                {description}
              </p>
            )}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <div className="mt-2">{children}</div>
      {hint && (
        <span className="mt-1.5 block font-body text-[0.72rem] text-[rgba(232,228,214,0.35)]">
          {hint}
        </span>
      )}
    </label>
  );
}

export function StatusNote({ state }: { state: { ok: boolean; message: string } }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={`font-body text-[0.82rem] ${
        state.ok ? "text-[rgba(140,190,150,0.9)]" : "text-[rgba(226,140,130,0.92)]"
      }`}
    >
      {state.message}
    </p>
  );
}
