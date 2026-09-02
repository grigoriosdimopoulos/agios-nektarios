"use client";

import { useActionState, useState } from "react";

import type { MediaItem } from "@/lib/content/schema";
import { IDLE } from "../action-state";
import { deleteMediaAction, uploadMediaAction } from "../actions";
import { StatusNote, buttonClass, ghostButtonClass, inputClass } from "../ui";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaManager({ items }: { items: MediaItem[] }) {
  const [uploadState, uploadAction, uploading] = useActionState(
    uploadMediaAction,
    IDLE,
  );
  const [deleteState, deleteAction] = useActionState(deleteMediaAction, IDLE);
  const [copied, setCopied] = useState<string>("");

  const copy = async (url: string) => {
    const absolute = new URL(url, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(url);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      window.prompt("Αντιγράψτε τον σύνδεσμο:", absolute);
    }
  };

  return (
    <div className="space-y-8">
      <form action={uploadAction} className="space-y-4">
        <input
          type="file"
          name="files"
          multiple
          accept="image/*,application/pdf"
          className={`${inputClass} file:mr-4 file:rounded-[2px] file:border-0 file:bg-[rgba(154,123,82,0.2)] file:px-4 file:py-2 file:font-body file:text-[0.7rem] file:uppercase file:tracking-[0.2em] file:text-[var(--ivory)]`}
        />
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={uploading} className={buttonClass}>
            {uploading ? "Ανέβασμα…" : "Ανέβασμα"}
          </button>
          <StatusNote state={uploadState} />
        </div>
        <p className="font-body text-[0.75rem] text-[rgba(232,228,214,0.35)]">
          Εικόνες (JPG, PNG, WebP, GIF, AVIF, SVG) και PDF έως 12 MB.
        </p>
      </form>

      <StatusNote state={deleteState} />

      {items.length === 0 ? (
        <p className="font-body text-[0.85rem] text-[rgba(232,228,214,0.4)]">
          Δεν υπάρχουν αρχεία ακόμη.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.key}
              className="overflow-hidden rounded-[3px] border border-[rgba(232,228,214,0.08)] bg-[rgba(7,8,9,0.5)]"
            >
              <div className="flex h-36 items-center justify-center bg-[rgba(0,0,0,0.35)]">
                {item.contentType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-body text-[0.7rem] uppercase tracking-[0.2em] text-[rgba(232,228,214,0.4)]">
                    PDF
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                <p className="truncate font-body text-[0.82rem] text-[rgba(232,228,214,0.75)]">
                  {item.name}
                </p>
                <p className="font-body text-[0.7rem] text-[rgba(232,228,214,0.35)]">
                  {formatSize(item.size)} ·{" "}
                  {new Date(item.uploadedAt).toLocaleDateString("el-GR")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copy(item.url)}
                    className={ghostButtonClass}
                  >
                    {copied === item.url ? "Αντιγράφηκε" : "Σύνδεσμος"}
                  </button>
                  <form action={deleteAction}>
                    <input type="hidden" name="key" value={item.key} />
                    <button type="submit" className={ghostButtonClass}>
                      Διαγραφή
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
