import { AmbientBackdrop } from "./AmbientBackdrop";
import { HomeSections } from "./HomeSections";
import { ImmersiveLanding } from "./ImmersiveLanding";
import { ScrollProgressBar } from "./ScrollProgressBar";
import { SiteFooter } from "./SiteFooter";

export function HomePageClient() {
  return (
    <>
      <AmbientBackdrop />
      <ScrollProgressBar />
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-sm border border-[rgba(232,228,214,0.12)] bg-[rgba(7,8,9,0.7)] px-4 py-2 font-body text-sm text-[rgba(232,228,214,0.85)] backdrop-blur-md transition focus:translate-y-0"
      >
        Παράβλεψη στο περιεχόμενο
      </a>
      <main id="main-content">
        <ImmersiveLanding />
        <HomeSections />
      </main>
      <SiteFooter />
    </>
  );
}
