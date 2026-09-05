"use client";

import { useActionState, useState } from "react";

import type {
  BoardMember,
  HomeContent,
  LinkItem,
  StatItem,
} from "@/lib/content/schema";
import { IDLE } from "../action-state";
import { resetHomeAction, saveHomeAction } from "../actions";
import {
  Panel,
  StatusNote,
  buttonClass,
  ghostButtonClass,
  inputClass,
  labelClass,
} from "../ui";

function Text({
  label,
  value,
  onChange,
  rows,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} mt-2 leading-relaxed`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} mt-2`}
        />
      )}
      {hint && (
        <span className="mt-1.5 block font-body text-[0.72rem] text-[rgba(232,228,214,0.32)]">
          {hint}
        </span>
      )}
    </label>
  );
}

function RowActions({
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1.5">
      <button type="button" onClick={onMoveUp} className={ghostButtonClass} aria-label="Πάνω">
        ↑
      </button>
      <button type="button" onClick={onMoveDown} className={ghostButtonClass} aria-label="Κάτω">
        ↓
      </button>
      <button type="button" onClick={onRemove} className={ghostButtonClass} aria-label="Διαγραφή">
        ✕
      </button>
    </div>
  );
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function HomeEditor({ initial }: { initial: HomeContent }) {
  const [content, setContent] = useState<HomeContent>(initial);
  const [state, formAction, pending] = useActionState(saveHomeAction, IDLE);
  const [resetState, resetFormAction, resetting] = useActionState(
    resetHomeAction,
    IDLE,
  );

  const patch = <K extends keyof HomeContent>(
    key: K,
    value: Partial<HomeContent[K]>,
  ) =>
    setContent((current) => ({
      ...current,
      [key]: { ...current[key], ...value },
    }));

  const setList = <K extends keyof HomeContent>(key: K, value: HomeContent[K]) =>
    setContent((current) => ({ ...current, [key]: value }));

  const setStats = (stats: StatItem[]) => setList("stats", stats);
  const setFolklore = (items: LinkItem[]) =>
    patch("folklore", { items });
  const setBoard = (members: BoardMember[]) => patch("board", { members });
  const setDocuments = (links: LinkItem[]) => patch("documents", { links });
  const setNews = (items: LinkItem[]) => patch("news", { items });

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-8">
        <input type="hidden" name="payload" value={JSON.stringify(content)} />

        <Panel title="Εισαγωγή (hero)">
          <div className="grid gap-5 md:grid-cols-2">
            <Text
              label="Τίτλος — πρώτη γραμμή"
              value={content.hero.titleTop}
              onChange={(titleTop) => patch("hero", { titleTop })}
            />
            <Text
              label="Τίτλος — δεύτερη γραμμή"
              value={content.hero.titleBottom}
              onChange={(titleBottom) => patch("hero", { titleBottom })}
            />
            <Text
              label="Ένδειξη αριστερά"
              value={content.hero.metaLeft}
              onChange={(metaLeft) => patch("hero", { metaLeft })}
            />
            <Text
              label="Ένδειξη κέντρο"
              value={content.hero.metaCenter}
              onChange={(metaCenter) => patch("hero", { metaCenter })}
            />
            <Text
              label="Ένδειξη δεξιά"
              value={content.hero.metaRight}
              onChange={(metaRight) => patch("hero", { metaRight })}
            />
            <Text
              label="Κυλιόμενο κείμενο"
              value={content.hero.ticker}
              onChange={(ticker) => patch("hero", { ticker })}
              hint="Επαναλαμβάνεται αυτόματα."
            />
          </div>
          <div className="mt-5">
            <Text
              label="Εισαγωγικό κείμενο"
              rows={3}
              value={content.hero.intro}
              onChange={(intro) => patch("hero", { intro })}
            />
          </div>
        </Panel>

        <Panel
          title="Αριθμοί"
          actions={
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => setStats([...content.stats, { value: "", label: "" }])}
            >
              + Προσθήκη
            </button>
          }
        >
          <div className="space-y-3">
            {content.stats.map((stat, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Text
                    label="Τιμή"
                    value={stat.value}
                    onChange={(value) =>
                      setStats(
                        content.stats.map((s, i) =>
                          i === index ? { ...s, value } : s,
                        ),
                      )
                    }
                  />
                  <Text
                    label="Ετικέτα"
                    value={stat.label}
                    onChange={(label) =>
                      setStats(
                        content.stats.map((s, i) =>
                          i === index ? { ...s, label } : s,
                        ),
                      )
                    }
                  />
                </div>
                <RowActions
                  onRemove={() =>
                    setStats(content.stats.filter((_, i) => i !== index))
                  }
                  onMoveUp={() => setStats(move(content.stats, index, index - 1))}
                  onMoveDown={() => setStats(move(content.stats, index, index + 1))}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Στροφή">
          <div className="space-y-3">
            <span className={labelClass}>Στίχοι</span>
            {content.essence.lines.map((line, index) => (
              <div key={index} className="flex items-start gap-3">
                <input
                  value={line}
                  onChange={(event) =>
                    patch("essence", {
                      lines: content.essence.lines.map((l, i) =>
                        i === index ? event.target.value : l,
                      ),
                    })
                  }
                  className={inputClass}
                />
                <RowActions
                  onRemove={() =>
                    patch("essence", {
                      lines: content.essence.lines.filter((_, i) => i !== index),
                    })
                  }
                  onMoveUp={() =>
                    patch("essence", {
                      lines: move(content.essence.lines, index, index - 1),
                    })
                  }
                  onMoveDown={() =>
                    patch("essence", {
                      lines: move(content.essence.lines, index, index + 1),
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() =>
                patch("essence", { lines: [...content.essence.lines, ""] })
              }
            >
              + Στίχος
            </button>
          </div>
          <div className="mt-5">
            <Text
              label="Απόδοση (ποιητής, τίτλος)"
              value={content.essence.attribution}
              onChange={(attribution) => patch("essence", { attribution })}
            />
          </div>
        </Panel>

        <Panel title="Ο οικισμός μας">
          <div className="grid gap-5 md:grid-cols-2">
            <Text
              label="Ετικέτα"
              value={content.settlement.label}
              onChange={(label) => patch("settlement", { label })}
            />
            <Text
              label="Τίτλος"
              value={content.settlement.title}
              onChange={(title) => patch("settlement", { title })}
            />
          </div>
          <div className="mt-5 space-y-3">
            <span className={labelClass}>Παράγραφοι</span>
            {content.settlement.paragraphs.map((paragraph, index) => (
              <div key={index} className="flex items-start gap-3">
                <textarea
                  rows={3}
                  value={paragraph}
                  onChange={(event) =>
                    patch("settlement", {
                      paragraphs: content.settlement.paragraphs.map((p, i) =>
                        i === index ? event.target.value : p,
                      ),
                    })
                  }
                  className={`${inputClass} leading-relaxed`}
                />
                <RowActions
                  onRemove={() =>
                    patch("settlement", {
                      paragraphs: content.settlement.paragraphs.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                  onMoveUp={() =>
                    patch("settlement", {
                      paragraphs: move(
                        content.settlement.paragraphs,
                        index,
                        index - 1,
                      ),
                    })
                  }
                  onMoveDown={() =>
                    patch("settlement", {
                      paragraphs: move(
                        content.settlement.paragraphs,
                        index,
                        index + 1,
                      ),
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() =>
                patch("settlement", {
                  paragraphs: [...content.settlement.paragraphs, ""],
                })
              }
            >
              + Παράγραφος
            </button>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Text
              label="Σύνδεσμος «περισσότερα» — κείμενο"
              value={content.settlement.moreLabel}
              onChange={(moreLabel) => patch("settlement", { moreLabel })}
            />
            <Text
              label="Σύνδεσμος «περισσότερα» — διεύθυνση"
              value={content.settlement.moreHref}
              onChange={(moreHref) => patch("settlement", { moreHref })}
            />
            <Text
              label="Χάρτης — ενσωματωμένη διεύθυνση"
              value={content.settlement.mapEmbedUrl}
              onChange={(mapEmbedUrl) => patch("settlement", { mapEmbedUrl })}
            />
            <Text
              label="Χάρτης — σύνδεσμος"
              value={content.settlement.mapLinkUrl}
              onChange={(mapLinkUrl) => patch("settlement", { mapLinkUrl })}
            />
          </div>
        </Panel>

        <Panel
          title="Λαογραφία & ιστορία"
          actions={
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() =>
                setFolklore([
                  ...content.folklore.items,
                  { num: "", title: "", sub: "", href: "/" },
                ])
              }
            >
              + Προσθήκη
            </button>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Text
              label="Ετικέτα"
              value={content.folklore.label}
              onChange={(label) => patch("folklore", { label })}
            />
            <Text
              label="Τίτλος"
              value={content.folklore.title}
              onChange={(title) => patch("folklore", { title })}
            />
          </div>
          <div className="mt-6 space-y-4">
            {content.folklore.items.map((item, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="grid flex-1 gap-3 md:grid-cols-4">
                  <Text
                    label="Αρ."
                    value={item.num ?? ""}
                    onChange={(num) =>
                      setFolklore(
                        content.folklore.items.map((it, i) =>
                          i === index ? { ...it, num } : it,
                        ),
                      )
                    }
                  />
                  <Text
                    label="Τίτλος"
                    value={item.title}
                    onChange={(title) =>
                      setFolklore(
                        content.folklore.items.map((it, i) =>
                          i === index ? { ...it, title } : it,
                        ),
                      )
                    }
                  />
                  <Text
                    label="Υπότιτλος"
                    value={item.sub ?? ""}
                    onChange={(sub) =>
                      setFolklore(
                        content.folklore.items.map((it, i) =>
                          i === index ? { ...it, sub } : it,
                        ),
                      )
                    }
                  />
                  <Text
                    label="Σύνδεσμος"
                    value={item.href}
                    onChange={(href) =>
                      setFolklore(
                        content.folklore.items.map((it, i) =>
                          i === index ? { ...it, href } : it,
                        ),
                      )
                    }
                  />
                </div>
                <RowActions
                  onRemove={() =>
                    setFolklore(content.folklore.items.filter((_, i) => i !== index))
                  }
                  onMoveUp={() =>
                    setFolklore(move(content.folklore.items, index, index - 1))
                  }
                  onMoveDown={() =>
                    setFolklore(move(content.folklore.items, index, index + 1))
                  }
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Εκδήλωση">
          <div className="grid gap-5 md:grid-cols-2">
            <Text
              label="Ετικέτα"
              value={content.event.label}
              onChange={(label) => patch("event", { label })}
            />
            <Text
              label="Τίτλος"
              value={content.event.title}
              onChange={(title) => patch("event", { title })}
            />
            <Text
              label="Κείμενο συνδέσμου"
              value={content.event.linkLabel}
              onChange={(linkLabel) => patch("event", { linkLabel })}
            />
            <Text
              label="Διεύθυνση συνδέσμου"
              value={content.event.linkHref}
              onChange={(linkHref) => patch("event", { linkHref })}
            />
            <Text
              label="Εικόνα"
              value={content.event.imageUrl}
              onChange={(imageUrl) => patch("event", { imageUrl })}
              hint="Επικολλήστε σύνδεσμο από τα «Αρχεία»."
            />
          </div>
          <div className="mt-5">
            <Text
              label="Κείμενο"
              rows={3}
              value={content.event.text}
              onChange={(text) => patch("event", { text })}
            />
          </div>
        </Panel>

        <Panel
          title="Διοικητικό συμβούλιο"
          actions={
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => setBoard([...content.board.members, { role: "", name: "" }])}
            >
              + Προσθήκη
            </button>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Text
              label="Ετικέτα"
              value={content.board.label}
              onChange={(label) => patch("board", { label })}
            />
            <Text
              label="Τίτλος"
              value={content.board.title}
              onChange={(title) => patch("board", { title })}
            />
          </div>
          <div className="mt-6 space-y-3">
            {content.board.members.map((member, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Text
                    label="Ιδιότητα"
                    value={member.role}
                    onChange={(role) =>
                      setBoard(
                        content.board.members.map((m, i) =>
                          i === index ? { ...m, role } : m,
                        ),
                      )
                    }
                  />
                  <Text
                    label="Ονοματεπώνυμο"
                    value={member.name}
                    onChange={(name) =>
                      setBoard(
                        content.board.members.map((m, i) =>
                          i === index ? { ...m, name } : m,
                        ),
                      )
                    }
                  />
                </div>
                <RowActions
                  onRemove={() =>
                    setBoard(content.board.members.filter((_, i) => i !== index))
                  }
                  onMoveUp={() => setBoard(move(content.board.members, index, index - 1))}
                  onMoveDown={() => setBoard(move(content.board.members, index, index + 1))}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Έγγραφα"
          actions={
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() =>
                setDocuments([...content.documents.links, { title: "", href: "/" }])
              }
            >
              + Προσθήκη
            </button>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Text
              label="Ετικέτα"
              value={content.documents.label}
              onChange={(label) => patch("documents", { label })}
            />
            <Text
              label="Τίτλος"
              value={content.documents.title}
              onChange={(title) => patch("documents", { title })}
            />
          </div>
          <div className="mt-5">
            <Text
              label="Κείμενο"
              rows={3}
              value={content.documents.text}
              onChange={(text) => patch("documents", { text })}
            />
          </div>
          <div className="mt-6 space-y-3">
            {content.documents.links.map((link, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Text
                    label="Τίτλος"
                    value={link.title}
                    onChange={(title) =>
                      setDocuments(
                        content.documents.links.map((l, i) =>
                          i === index ? { ...l, title } : l,
                        ),
                      )
                    }
                  />
                  <Text
                    label="Σύνδεσμος"
                    value={link.href}
                    onChange={(href) =>
                      setDocuments(
                        content.documents.links.map((l, i) =>
                          i === index ? { ...l, href, external: /^https?:/i.test(href) } : l,
                        ),
                      )
                    }
                  />
                </div>
                <RowActions
                  onRemove={() =>
                    setDocuments(content.documents.links.filter((_, i) => i !== index))
                  }
                  onMoveUp={() => setDocuments(move(content.documents.links, index, index - 1))}
                  onMoveDown={() => setDocuments(move(content.documents.links, index, index + 1))}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Νέα & ανακοινώσεις"
          actions={
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => setNews([...content.news.items, { title: "", href: "/" }])}
            >
              + Προσθήκη
            </button>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Text
              label="Ετικέτα"
              value={content.news.label}
              onChange={(label) => patch("news", { label })}
            />
            <Text
              label="Τίτλος"
              value={content.news.title}
              onChange={(title) => patch("news", { title })}
            />
          </div>
          <div className="mt-6 space-y-3">
            {content.news.items.map((item, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Text
                    label="Τίτλος"
                    value={item.title}
                    onChange={(title) =>
                      setNews(
                        content.news.items.map((n, i) =>
                          i === index ? { ...n, title } : n,
                        ),
                      )
                    }
                  />
                  <Text
                    label="Σύνδεσμος"
                    value={item.href}
                    onChange={(href) =>
                      setNews(
                        content.news.items.map((n, i) =>
                          i === index ? { ...n, href, external: /^https?:/i.test(href) } : n,
                        ),
                      )
                    }
                  />
                </div>
                <RowActions
                  onRemove={() => setNews(content.news.items.filter((_, i) => i !== index))}
                  onMoveUp={() => setNews(move(content.news.items, index, index - 1))}
                  onMoveDown={() => setNews(move(content.news.items, index, index + 1))}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Επικοινωνία">
          <div className="grid gap-5 md:grid-cols-2">
            <Text
              label="Ετικέτα"
              value={content.contact.label}
              onChange={(label) => patch("contact", { label })}
            />
            <Text
              label="Τίτλος"
              value={content.contact.title}
              onChange={(title) => patch("contact", { title })}
            />
            <Text
              label="Email"
              value={content.contact.email}
              onChange={(email) => patch("contact", { email })}
            />
          </div>
          <div className="mt-5">
            <Text
              label="Κείμενο"
              rows={3}
              value={content.contact.text}
              onChange={(text) => patch("contact", { text })}
            />
          </div>
        </Panel>

        <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-[3px] border border-[rgba(232,228,214,0.08)] bg-[rgba(10,12,15,0.92)] p-4 backdrop-blur">
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Αποθήκευση…" : "Αποθήκευση αρχικής"}
          </button>
          <StatusNote state={state} />
        </div>
      </form>

      <form action={resetFormAction} className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={resetting} className={ghostButtonClass}>
          {resetting ? "Επαναφορά…" : "Επαναφορά αρχικών τιμών"}
        </button>
        <StatusNote state={resetState} />
      </form>
    </div>
  );
}
