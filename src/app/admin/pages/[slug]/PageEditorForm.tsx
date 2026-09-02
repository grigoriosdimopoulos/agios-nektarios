"use client";

import { useActionState } from "react";

import type { MediaItem, PageContent } from "@/lib/content/schema";
import { IDLE } from "../../action-state";
import { resetPageAction, savePageAction } from "../../actions";
import { RichTextEditor } from "../../RichTextEditor";
import {
  StatusNote,
  buttonClass,
  ghostButtonClass,
  inputClass,
  labelClass,
} from "../../ui";

export function PageEditorForm({
  page,
  media,
}: {
  page: PageContent;
  media: MediaItem[];
}) {
  const [state, formAction, pending] = useActionState(savePageAction, IDLE);
  const [resetState, resetFormAction, resetting] = useActionState(
    resetPageAction,
    IDLE,
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="slug" value={page.slug} />
        <label className="block">
          <span className={labelClass}>Τίτλος σελίδας</span>
          <input
            name="title"
            defaultValue={page.title}
            required
            className={`${inputClass} mt-2`}
          />
        </label>

        <RichTextEditor
          key={`${page.slug}-${resetState.ok ? "reset" : "current"}`}
          name="html"
          initialHtml={page.html}
          media={media}
        />

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Αποθήκευση…" : "Αποθήκευση"}
          </button>
          <StatusNote state={state} />
        </div>
      </form>

      <form action={resetFormAction} className="flex flex-wrap items-center gap-4">
        <input type="hidden" name="slug" value={page.slug} />
        <button type="submit" disabled={resetting} className={ghostButtonClass}>
          {resetting ? "Επαναφορά…" : "Επαναφορά αρχικού κειμένου"}
        </button>
        <StatusNote state={resetState} />
      </form>
    </div>
  );
}
