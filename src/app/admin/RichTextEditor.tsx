"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MediaItem } from "@/lib/content/schema";

type Props = {
  name: string;
  initialHtml: string;
  media?: MediaItem[];
};

const TOOL_BUTTON =
  "rounded-[2px] border border-[rgba(232,228,214,0.1)] px-2.5 py-1.5 font-body text-[0.72rem] text-[rgba(232,228,214,0.62)] transition hover:border-[rgba(154,123,82,0.4)] hover:text-[var(--ivory)]";

/**
 * Lightweight WYSIWYG: a contentEditable surface with a small toolbar and a
 * raw-HTML mode. The value is mirrored into a hidden input so the enclosing
 * server-action form submits it like any other field.
 */
export function RichTextEditor({ name, initialHtml, media = [] }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(initialHtml);
  const [mode, setMode] = useState<"rich" | "html">("rich");

  // Seed the editable surface once; afterwards the DOM owns the caret.
  useEffect(() => {
    if (mode === "rich" && editorRef.current) {
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
    // Only re-seed when switching modes, never on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const exec = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  }, []);

  const insertImage = useCallback(
    (url: string) => {
      if (url) exec("insertImage", url);
    },
    [exec],
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={html} />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={TOOL_BUTTON} onClick={() => exec("bold")}>
          <b>B</b>
        </button>
        <button type="button" className={TOOL_BUTTON} onClick={() => exec("italic")}>
          <i>I</i>
        </button>
        <button
          type="button"
          className={TOOL_BUTTON}
          onClick={() => exec("formatBlock", "<h3>")}
        >
          Τίτλος
        </button>
        <button
          type="button"
          className={TOOL_BUTTON}
          onClick={() => exec("formatBlock", "<p>")}
        >
          Παράγραφος
        </button>
        <button
          type="button"
          className={TOOL_BUTTON}
          onClick={() => exec("insertUnorderedList")}
        >
          Λίστα
        </button>
        <button
          type="button"
          className={TOOL_BUTTON}
          onClick={() => {
            const url = window.prompt("Διεύθυνση συνδέσμου:");
            if (url) exec("createLink", url);
          }}
        >
          Σύνδεσμος
        </button>
        <button
          type="button"
          className={TOOL_BUTTON}
          onClick={() => exec("removeFormat")}
        >
          Καθαρισμός
        </button>

        {media.length > 0 && (
          <select
            className={`${TOOL_BUTTON} bg-[rgba(7,8,9,0.8)]`}
            defaultValue=""
            onChange={(event) => {
              insertImage(event.target.value);
              event.target.value = "";
            }}
          >
            <option value="">Εισαγωγή εικόνας…</option>
            {media
              .filter((item) => item.contentType.startsWith("image/"))
              .map((item) => (
                <option key={item.key} value={item.url}>
                  {item.name}
                </option>
              ))}
          </select>
        )}

        <button
          type="button"
          className={`${TOOL_BUTTON} ml-auto`}
          onClick={() => {
            if (mode === "rich" && editorRef.current) {
              setHtml(editorRef.current.innerHTML);
            }
            setMode(mode === "rich" ? "html" : "rich");
          }}
        >
          {mode === "rich" ? "HTML" : "Κείμενο"}
        </button>
      </div>

      {mode === "rich" ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Περιεχόμενο σελίδας"
          onInput={(event) => setHtml(event.currentTarget.innerHTML)}
          onBlur={(event) => setHtml(event.currentTarget.innerHTML)}
          className="legacy-prose min-h-[24rem] rounded-[2px] border border-[rgba(232,228,214,0.12)] bg-[rgba(7,8,9,0.6)] px-5 py-4 outline-none focus:border-[rgba(154,123,82,0.5)]"
        />
      ) : (
        <textarea
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          spellCheck={false}
          className="min-h-[24rem] w-full rounded-[2px] border border-[rgba(232,228,214,0.12)] bg-[rgba(7,8,9,0.6)] px-4 py-3 font-mono text-[0.8rem] leading-relaxed text-[rgba(232,228,214,0.8)] outline-none focus:border-[rgba(154,123,82,0.5)]"
        />
      )}
    </div>
  );
}
