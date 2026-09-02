import { getHomeContent } from "@/lib/content";
import { HomeEditor } from "./HomeEditor";

export const dynamic = "force-dynamic";

export default async function AdminHomeEditorPage() {
  const content = await getHomeContent();
  return (
    <>
      <div>
        <h1 className="font-display text-[2rem] font-medium text-[var(--ivory)]">
          Αρχική σελίδα
        </h1>
        <p className="mt-2 font-body text-[0.88rem] text-[rgba(232,228,214,0.45)]">
          Όλα τα κείμενα της αρχικής σελίδας.
        </p>
      </div>
      <HomeEditor initial={content} />
    </>
  );
}
