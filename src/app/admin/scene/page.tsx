import { getSiteSettings } from "@/lib/content";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminScenePage() {
  const settings = await getSiteSettings();
  return (
    <>
      <div>
        <h1 className="font-display text-[2rem] font-medium text-[var(--ivory)]">
          Σκηνικό & ρυθμίσεις
        </h1>
        <p className="mt-2 font-body text-[0.88rem] text-[rgba(232,228,214,0.45)]">
          Ρυθμίσεις ιστότοπου και του ζωντανού φόντου.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </>
  );
}
