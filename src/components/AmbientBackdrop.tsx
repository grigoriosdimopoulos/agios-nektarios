type Props = { variant?: "full" | "subtle" };

/**
 * Full-screen void base. No hooks, no motion, no heavy blur.
 * CSS animations only — GPU-composited without React re-renders.
 */
export function AmbientBackdrop({ variant = "full" }: Props) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-[1] ${variant === "subtle" ? "opacity-50" : ""}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#070809]" />
      <div className="orb-breathe absolute -left-[22%] bottom-[8%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(154,123,82,0.048)_0%,transparent_65%)] blur-[80px]" />
      <div className="orb-breathe-slow absolute -right-[18%] top-[12%] h-[48vh] w-[48vh] rounded-full bg-[radial-gradient(circle,rgba(24,40,54,0.2)_0%,transparent_60%)] blur-[72px]" />
      <div
        className="absolute inset-0 opacity-[0.026] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
