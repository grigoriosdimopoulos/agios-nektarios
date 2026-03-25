import { DepthLayer } from "./DepthLayer";

type Props = { className?: string; variant?: "hero" | "section" };

/**
 * Localized atmospheric stack: 2 orbs + warm pulse + vignette + grain.
 * Server-renderable — no hooks. Orbs animate via CSS keyframes only.
 */
export function AtmosphericField({ className = "", variant = "section" }: Props) {
  const hero = variant === "hero";
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className={
          hero
            ? "absolute inset-0 bg-[radial-gradient(ellipse_80%_58%_at_50%_16%,rgba(50,76,96,0.18)_0%,transparent_58%)]"
            : "absolute inset-0 bg-[radial-gradient(ellipse_70%_48%_at_50%_0%,rgba(38,54,68,0.13)_0%,transparent_62%)]"
        }
      />
      <DepthLayer factor={0.5} className="absolute inset-0">
        <div className="orb-breathe absolute -left-[10%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(154,123,82,0.065)_0%,transparent_65%)] blur-[72px]" />
      </DepthLayer>
      <DepthLayer factor={0.88} className="absolute inset-0">
        <div className="orb-breathe-slow absolute right-[5%] top-[18%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(232,228,214,0.028)_0%,transparent_62%)] blur-[60px]" />
      </DepthLayer>
      <div className="orb-pulse absolute inset-0 bg-[radial-gradient(ellipse_52%_34%_at_50%_100%,rgba(154,123,82,0.088)_0%,transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,9,0.12)_0%,rgba(7,8,9,0.04)_30%,rgba(7,8,9,0.76)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
