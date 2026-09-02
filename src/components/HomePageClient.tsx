import type { HomeContent, SiteSettings } from "@/lib/content/schema";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { HomeSections } from "./HomeSections";
import { ImmersiveLanding } from "./ImmersiveLanding";
import { LivingScene } from "./LivingScene";
import { ScrollProgressBar } from "./ScrollProgressBar";
import { SiteFooter } from "./SiteFooter";

export function HomePageClient({
  content,
  settings,
}: {
  content: HomeContent;
  settings: SiteSettings;
}) {
  const sceneEnabled = settings.scene.enabled;

  return (
    <>
      {sceneEnabled ? (
        <LivingScene settings={settings.scene} />
      ) : (
        <AmbientBackdrop />
      )}
      <ScrollProgressBar />
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-sm border border-[rgba(232,228,214,0.12)] bg-[rgba(7,8,9,0.7)] px-4 py-2 font-body text-sm text-[rgba(232,228,214,0.85)] backdrop-blur-md transition focus:translate-y-0"
      >
        Παράβλεψη στο περιεχόμενο
      </a>
      <main id="main-content">
        <ImmersiveLanding hero={content.hero} sceneEnabled={sceneEnabled} />
        <HomeSections content={content} />
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
