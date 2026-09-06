"use client";

import { useActionState, useState } from "react";

import { resetEverythingAction } from "./actions";
import { IDLE } from "./action-state";
import { StatusNote, ghostButtonClass } from "./ui";

/**
 * One button that puts every page and the home page back to the texts and
 * photographs that ship with the site. It asks first, because it discards
 * whatever has been written since.
 */
export function ResetEverything({ editedCount }: { editedCount: number }) {
  const [armed, setArmed] = useState(false);
  const [state, formAction, pending] = useActionState(resetEverythingAction, IDLE);

  return (
    <div className="mt-8 border-t border-[rgba(232,228,214,0.07)] pt-6">
      <p className="font-body text-[0.82rem] leading-relaxed text-[rgba(232,228,214,0.45)]">
        Επαναφορά όλου του ιστότοπου στα κείμενα και τις φωτογραφίες με τα οποία
        δημοσιεύτηκε.{" "}
        {editedCount > 0
          ? `Θα χαθούν οι αλλαγές σε ${editedCount} ${editedCount === 1 ? "σελίδα" : "σελίδες"} και στην αρχική.`
          : "Αυτή τη στιγμή δεν υπάρχουν αποθηκευμένες αλλαγές."}
      </p>

      {armed ? (
        <form action={formAction} className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={ghostButtonClass}>
            {pending ? "Επαναφορά…" : "Ναι, επαναφορά όλων"}
          </button>
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="font-body text-[0.72rem] uppercase tracking-[0.2em] text-[rgba(232,228,214,0.4)] transition hover:text-[rgba(232,228,214,0.7)]"
          >
            Άκυρο
          </button>
          <StatusNote state={state} />
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setArmed(true)}
            className={ghostButtonClass}
          >
            Επαναφορά όλων
          </button>
          <StatusNote state={state} />
        </div>
      )}
    </div>
  );
}
