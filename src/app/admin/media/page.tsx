import { listMedia } from "@/lib/content";
import { Panel } from "../ui";
import { MediaManager } from "./MediaManager";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const items = await listMedia();
  return (
    <Panel
      title="Αρχεία"
      description="Ανεβάστε φωτογραφίες και έγγραφα. Αντιγράψτε τον σύνδεσμο για να τα βάλετε σε μια σελίδα ή ως φόντο του σκηνικού."
    >
      <MediaManager items={items} />
    </Panel>
  );
}
